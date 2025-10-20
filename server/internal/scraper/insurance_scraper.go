package scraper

import (
	"context"
	"fmt"
	"log"
	"math/rand"
	"regexp"
	"strconv"
	"time"

	"eesigorta/backend/internal/repo"

	"github.com/go-rod/rod"
	"github.com/go-rod/rod/lib/launcher"
)

// InsuranceScraper handles scraping insurance company websites
type InsuranceScraper struct {
	browser *rod.Browser
	config  *InsuranceScraperConfig
}

// InsuranceScraperConfig configuration for insurance scraping
type InsuranceScraperConfig struct {
	Enabled           bool
	Headless          bool
	Timeout           time.Duration
	UserAgent         string
	WindowWidth       int
	WindowHeight      int
	ProxyList         []string
	MaxRetries        int
	DelayBetweenPages time.Duration
	RespectRobots     bool
}

// InsuranceQuoteData represents scraped quote data
type InsuranceQuoteData struct {
	CompanyName     string  `json:"company_name"`
	ProductName     string  `json:"product_name"`
	Premium         float64 `json:"premium"`
	CoverageAmount  float64 `json:"coverage_amount"`
	Discount        float64 `json:"discount"`
	FinalPrice      float64 `json:"final_price"`
	Currency        string  `json:"currency"`
	ValidUntil      string  `json:"valid_until"`
	PolicyNumber    string  `json:"policy_number"`
	AgentCommission float64 `json:"agent_commission"`
	Features        []string `json:"features"`
	Exclusions      []string `json:"exclusions"`
	ScrapedAt       time.Time `json:"scraped_at"`
}

// CustomerData represents customer information for form filling
type CustomerData struct {
	FirstName     string `json:"first_name"`
	LastName      string `json:"last_name"`
	Email         string `json:"email"`
	Phone         string `json:"phone"`
	TCKN          string `json:"tckn"`
	BirthDate     string `json:"birth_date"`
	Gender        string `json:"gender"`
	Address       string `json:"address"`
	City          string `json:"city"`
	District      string `json:"district"`
	PostalCode    string `json:"postal_code"`
	VehicleBrand  string `json:"vehicle_brand"`
	VehicleModel  string `json:"vehicle_model"`
	VehicleYear   int    `json:"vehicle_year"`
	VehiclePlate  string `json:"vehicle_plate"`
	LicensePlate  string `json:"license_plate"`
	EngineNumber  string `json:"engine_number"`
	ChassisNumber string `json:"chassis_number"`
}

// NewInsuranceScraper creates a new insurance scraper
func NewInsuranceScraper(cfg *InsuranceScraperConfig) (*InsuranceScraper, error) {
	if !cfg.Enabled {
		return &InsuranceScraper{config: cfg}, nil
	}

	var browser *rod.Browser
	var err error

	if cfg.Headless {
		browser = rod.New().MustConnect()
	} else {
		path, _ := launcher.LookPath()
		u := launcher.New().Bin(path).MustLaunch()
		browser = rod.New().ControlURL(u).MustConnect()
	}

	return &InsuranceScraper{
		browser: browser,
		config:  cfg,
	}, nil
}

// ScrapeInsuranceQuote scrapes quote from a specific insurance company
func (is *InsuranceScraper) ScrapeInsuranceQuote(target *repo.ScraperTarget, customerData *CustomerData) (*InsuranceQuoteData, error) {
	if !is.config.Enabled {
		return nil, fmt.Errorf("insurance scraping is disabled")
	}

	page := is.browser.MustPage()
	defer page.MustClose()

	// Apply stealth mode
	if err := is.enableStealthMode(page); err != nil {
		log.Printf("Failed to enable stealth mode: %v", err)
	}

	// Set user agent and viewport
	page.MustSetUserAgent(&rod.UserAgent{UserAgent: is.config.UserAgent})
	page.MustSetViewport(&rod.Viewport{
		Width:  is.config.WindowWidth,
		Height: is.config.WindowHeight,
	})

	// Navigate to the insurance company's quote page
	err := page.Navigate(target.BaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to navigate to %s: %w", target.BaseURL, err)
	}

	// Wait for page to load
	ctx, cancel := context.WithTimeout(context.Background(), is.config.Timeout)
	defer cancel()

	err = page.Context(ctx).WaitLoad()
	if err != nil {
		return nil, fmt.Errorf("failed to load page: %w", err)
	}

	// Apply anti-bot strategies
	if err := is.applyAntiBotStrategies(page); err != nil {
		log.Printf("Failed to apply anti-bot strategies: %v", err)
	}

	// Fill the quote form with customer data
	if err := is.fillQuoteForm(page, customerData, target); err != nil {
		return nil, fmt.Errorf("failed to fill quote form: %w", err)
	}

	// Submit the form and wait for results
	if err := is.submitQuoteForm(page, target); err != nil {
		return nil, fmt.Errorf("failed to submit quote form: %w", err)
	}

	// Extract quote data
	quoteData, err := is.extractQuoteData(page, target)
	if err != nil {
		return nil, fmt.Errorf("failed to extract quote data: %w", err)
	}

	return quoteData, nil
}

// fillQuoteForm fills the insurance quote form with customer data
func (is *InsuranceScraper) fillQuoteForm(page *rod.Page, customerData *CustomerData, target *repo.ScraperTarget) error {
	// Define field mappings for different insurance companies
	fieldMappings := is.getFieldMappings(target.Name)

	// Fill personal information
	if firstNameSelector, ok := fieldMappings["first_name"]; ok {
		if err := is.fillField(page, firstNameSelector, customerData.FirstName); err != nil {
			log.Printf("Failed to fill first name: %v", err)
		}
	}

	if lastNameSelector, ok := fieldMappings["last_name"]; ok {
		if err := is.fillField(page, lastNameSelector, customerData.LastName); err != nil {
			log.Printf("Failed to fill last name: %v", err)
		}
	}

	if emailSelector, ok := fieldMappings["email"]; ok {
		if err := is.fillField(page, emailSelector, customerData.Email); err != nil {
			log.Printf("Failed to fill email: %v", err)
		}
	}

	if phoneSelector, ok := fieldMappings["phone"]; ok {
		if err := is.fillField(page, phoneSelector, customerData.Phone); err != nil {
			log.Printf("Failed to fill phone: %v", err)
		}
	}

	if tcknSelector, ok := fieldMappings["tckn"]; ok {
		if err := is.fillField(page, tcknSelector, customerData.TCKN); err != nil {
			log.Printf("Failed to fill TCKN: %v", err)
		}
	}

	// Fill vehicle information
	if vehicleBrandSelector, ok := fieldMappings["vehicle_brand"]; ok {
		if err := is.fillField(page, vehicleBrandSelector, customerData.VehicleBrand); err != nil {
			log.Printf("Failed to fill vehicle brand: %v", err)
		}
	}

	if vehicleModelSelector, ok := fieldMappings["vehicle_model"]; ok {
		if err := is.fillField(page, vehicleModelSelector, customerData.VehicleModel); err != nil {
			log.Printf("Failed to fill vehicle model: %v", err)
		}
	}

	if vehicleYearSelector, ok := fieldMappings["vehicle_year"]; ok {
		if err := is.fillField(page, vehicleYearSelector, strconv.Itoa(customerData.VehicleYear)); err != nil {
			log.Printf("Failed to fill vehicle year: %v", err)
		}
	}

	if vehiclePlateSelector, ok := fieldMappings["vehicle_plate"]; ok {
		if err := is.fillField(page, vehiclePlateSelector, customerData.VehiclePlate); err != nil {
			log.Printf("Failed to fill vehicle plate: %v", err)
		}
	}

	// Add random delays between form fills
	time.Sleep(time.Duration(500+rand.Intn(1000)) * time.Millisecond)

	return nil
}

// fillField fills a specific form field
func (is *InsuranceScraper) fillField(page *rod.Page, selector, value string) error {
	element, err := page.Element(selector)
	if err != nil {
		return fmt.Errorf("element not found: %s", selector)
	}

	// Clear existing value
	element.MustEval("this.value = ''")

	// Type the value with human-like delays
	for _, char := range value {
		element.MustInput(string(char))
		time.Sleep(time.Duration(50+rand.Intn(100)) * time.Millisecond)
	}

	return nil
}

// submitQuoteForm submits the quote form
func (is *InsuranceScraper) submitQuoteForm(page *rod.Page, target *repo.ScraperTarget) error {
	// Find submit button
	submitSelectors := []string{
		"button[type='submit']",
		"input[type='submit']",
		".submit-btn",
		".quote-submit",
		"#submit",
		".btn-submit",
	}

	var submitButton *rod.Element
	var err error

	for _, selector := range submitSelectors {
		submitButton, err = page.Element(selector)
		if err == nil {
			break
		}
	}

	if submitButton == nil {
		return fmt.Errorf("submit button not found")
	}

	// Click submit button
	submitButton.MustClick()

	// Wait for results page to load
	time.Sleep(3 * time.Second)

	// Wait for quote results to appear
	page.MustWaitStable()

	return nil
}

// extractQuoteData extracts quote information from the results page
func (is *InsuranceScraper) extractQuoteData(page *rod.Page, target *repo.ScraperTarget) (*InsuranceQuoteData, error) {
	// JavaScript code to extract quote data
	jsCode := `
		(function() {
			const data = {};
			
			// Extract premium/price information
			const priceSelectors = [
				'.premium', '.price', '.cost', '.amount',
				'[class*="premium"]', '[class*="price"]', '[class*="cost"]',
				'.quote-price', '.insurance-price', '.total-price'
			];
			
			for (const selector of priceSelectors) {
				const element = document.querySelector(selector);
				if (element) {
					const text = element.textContent.trim();
					const price = parseFloat(text.replace(/[^\d.,]/g, '').replace(',', '.'));
					if (!isNaN(price) && price > 0) {
						data.premium = price;
						break;
					}
				}
			}
			
			// Extract coverage amount
			const coverageSelectors = [
				'.coverage', '.sum-insured', '.limit', '.amount-covered',
				'[class*="coverage"]', '[class*="limit"]'
			];
			
			for (const selector of coverageSelectors) {
				const element = document.querySelector(selector);
				if (element) {
					const text = element.textContent.trim();
					const amount = parseFloat(text.replace(/[^\d.,]/g, '').replace(',', '.'));
					if (!isNaN(amount) && amount > 0) {
						data.coverage_amount = amount;
						break;
					}
				}
			}
			
			// Extract discount
			const discountSelectors = [
				'.discount', '.saving', '.reduction', '.off',
				'[class*="discount"]', '[class*="saving"]'
			];
			
			for (const selector of discountSelectors) {
				const element = document.querySelector(selector);
				if (element) {
					const text = element.textContent.trim();
					const discount = parseFloat(text.replace(/[^\d.,]/g, '').replace(',', '.'));
					if (!isNaN(discount) && discount > 0) {
						data.discount = discount;
						break;
					}
				}
			}
			
			// Extract policy number
			const policySelectors = [
				'.policy-number', '.policy-no', '.quote-number', '.quote-no',
				'[class*="policy"]', '[class*="quote"]'
			];
			
			for (const selector of policySelectors) {
				const element = document.querySelector(selector);
				if (element) {
					const text = element.textContent.trim();
					if (text.length > 5) {
						data.policy_number = text;
						break;
					}
				}
			}
			
			// Extract valid until date
			const dateSelectors = [
				'.valid-until', '.expiry', '.expires', '.validity',
				'[class*="valid"]', '[class*="expiry"]'
			];
			
			for (const selector of dateSelectors) {
				const element = document.querySelector(selector);
				if (element) {
					const text = element.textContent.trim();
					if (text.match(/\d{1,2}[./]\d{1,2}[./]\d{2,4}/)) {
						data.valid_until = text;
						break;
					}
				}
			}
			
			// Extract features/benefits
			const featureElements = document.querySelectorAll('.feature, .benefit, .coverage-item, li');
			const features = [];
			featureElements.forEach(el => {
				const text = el.textContent.trim();
				if (text.length > 10 && text.length < 100) {
					features.push(text);
				}
			});
			if (features.length > 0) {
				data.features = features.slice(0, 10); // Limit to 10 features
			}
			
			return data;
		})()
	`

	result, err := page.Eval(jsCode)
	if err != nil {
		return nil, fmt.Errorf("failed to execute JavaScript: %w", err)
	}

	// Convert result to map
	data, ok := result.Value.(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("unexpected result type from JavaScript")
	}

	// Create InsuranceQuoteData
	quoteData := &InsuranceQuoteData{
		CompanyName: target.Name,
		ScrapedAt:   time.Now(),
		Currency:    "TRY",
	}

	// Parse premium
	if premium, ok := data["premium"].(float64); ok {
		quoteData.Premium = premium
	}

	// Parse coverage amount
	if coverage, ok := data["coverage_amount"].(float64); ok {
		quoteData.CoverageAmount = coverage
	}

	// Parse discount
	if discount, ok := data["discount"].(float64); ok {
		quoteData.Discount = discount
	}

	// Parse policy number
	if policyNo, ok := data["policy_number"].(string); ok {
		quoteData.PolicyNumber = policyNo
	}

	// Parse valid until
	if validUntil, ok := data["valid_until"].(string); ok {
		quoteData.ValidUntil = validUntil
	}

	// Parse features
	if features, ok := data["features"].([]interface{}); ok {
		for _, feature := range features {
			if str, ok := feature.(string); ok {
				quoteData.Features = append(quoteData.Features, str)
			}
		}
	}

	// Calculate final price
	quoteData.FinalPrice = quoteData.Premium - quoteData.Discount

	// Calculate agent commission (typically 10-15%)
	quoteData.AgentCommission = quoteData.FinalPrice * 0.12

	return quoteData, nil
}

// getFieldMappings returns field selectors for different insurance companies
func (is *InsuranceScraper) getFieldMappings(companyName string) map[string]string {
	// Common field mappings for Turkish insurance companies
	mappings := map[string]map[string]string{
		"Anadolu Sigorta": {
			"first_name":     "input[name='firstName'], input[name='first_name'], #firstName",
			"last_name":      "input[name='lastName'], input[name='last_name'], #lastName",
			"email":          "input[name='email'], input[type='email'], #email",
			"phone":          "input[name='phone'], input[name='telephone'], #phone",
			"tckn":           "input[name='tckn'], input[name='tcno'], #tckn",
			"vehicle_brand":   "select[name='brand'], select[name='vehicleBrand'], #brand",
			"vehicle_model":  "select[name='model'], select[name='vehicleModel'], #model",
			"vehicle_year":   "select[name='year'], select[name='vehicleYear'], #year",
			"vehicle_plate":  "input[name='plate'], input[name='licensePlate'], #plate",
		},
		"Allianz": {
			"first_name":     "input[name='firstName'], input[name='first_name'], #firstName",
			"last_name":      "input[name='lastName'], input[name='last_name'], #lastName",
			"email":          "input[name='email'], input[type='email'], #email",
			"phone":          "input[name='phone'], input[name='mobile'], #phone",
			"tckn":           "input[name='tckn'], input[name='tcno'], #tckn",
			"vehicle_brand":   "select[name='brand'], select[name='vehicleBrand'], #brand",
			"vehicle_model":  "select[name='model'], select[name='vehicleModel'], #model",
			"vehicle_year":   "select[name='year'], select[name='vehicleYear'], #year",
			"vehicle_plate":  "input[name='plate'], input[name='licensePlate'], #plate",
		},
		"Mapfre": {
			"first_name":     "input[name='firstName'], input[name='first_name'], #firstName",
			"last_name":      "input[name='lastName'], input[name='last_name'], #lastName",
			"email":          "input[name='email'], input[type='email'], #email",
			"phone":          "input[name='phone'], input[name='telephone'], #phone",
			"tckn":           "input[name='tckn'], input[name='tcno'], #tckn",
			"vehicle_brand":   "select[name='brand'], select[name='vehicleBrand'], #brand",
			"vehicle_model":  "select[name='model'], select[name='vehicleModel'], #model",
			"vehicle_year":   "select[name='year'], select[name='vehicleYear'], #year",
			"vehicle_plate":  "input[name='plate'], input[name='licensePlate'], #plate",
		},
	}

	// Return mappings for the specific company or default mappings
	if companyMappings, ok := mappings[companyName]; ok {
		return companyMappings
	}

	// Default mappings
	return map[string]string{
		"first_name":     "input[name='firstName'], input[name='first_name'], #firstName",
		"last_name":      "input[name='lastName'], input[name='last_name'], #lastName",
		"email":          "input[name='email'], input[type='email'], #email",
		"phone":          "input[name='phone'], input[name='telephone'], #phone",
		"tckn":           "input[name='tckn'], input[name='tcno'], #tckn",
		"vehicle_brand":   "select[name='brand'], select[name='vehicleBrand'], #brand",
		"vehicle_model":  "select[name='model'], select[name='vehicleModel'], #model",
		"vehicle_year":   "select[name='year'], select[name='vehicleYear'], #year",
		"vehicle_plate":  "input[name='plate'], input[name='licensePlate'], #plate",
	}
}

// enableStealthMode enables stealth mode to avoid detection
func (is *InsuranceScraper) enableStealthMode(page *rod.Page) error {
	stealthJS := `
		// Override navigator properties
		Object.defineProperty(navigator, 'webdriver', {
			get: () => undefined,
		});
		
		Object.defineProperty(navigator, 'plugins', {
			get: () => [1, 2, 3, 4, 5],
		});
		
		Object.defineProperty(navigator, 'languages', {
			get: () => ['tr-TR', 'tr', 'en-US', 'en'],
		});
		
		// Override chrome runtime
		window.chrome = {
			runtime: {},
		};
		
		// Override permissions
		const originalQuery = window.navigator.permissions.query;
		window.navigator.permissions.query = (parameters) => (
			parameters.name === 'notifications' ?
				Promise.resolve({ state: Notification.permission }) :
				originalQuery(parameters)
		);
	`

	_, err := page.Eval(stealthJS)
	return err
}

// applyAntiBotStrategies applies various anti-bot detection strategies
func (is *InsuranceScraper) applyAntiBotStrategies(page *rod.Page) error {
	// Random mouse movements
	page.MustMouseMove(100, 100)
	time.Sleep(100 * time.Millisecond)
	page.MustMouseMove(200, 200)
	time.Sleep(100 * time.Millisecond)

	// Random scroll
	page.MustScroll(0, 300)
	time.Sleep(500 * time.Millisecond)
	page.MustScroll(0, -300)

	// Random delay
	time.Sleep(time.Duration(1000+rand.Intn(2000)) * time.Millisecond)

	return nil
}

// Close closes the browser
func (is *InsuranceScraper) Close() error {
	if is.browser != nil {
		return is.browser.Close()
	}
	return nil
}

// ValidateTCKN validates Turkish ID number
func ValidateTCKN(tckn string) bool {
	if len(tckn) != 11 {
		return false
	}

	// Check if all digits
	for _, char := range tckn {
		if char < '0' || char > '9' {
			return false
		}
	}

	// TCKN validation algorithm
	sum := 0
	for i := 0; i < 10; i++ {
		sum += int(tckn[i] - '0')
	}

	if sum%10 != int(tckn[10]-'0') {
		return false
	}

	return true
}

// NormalizePhone normalizes Turkish phone numbers
func NormalizePhone(phone string) string {
	// Remove all non-digit characters
	re := regexp.MustCompile(`\D`)
	digits := re.ReplaceAllString(phone, "")

	// Add country code if missing
	if len(digits) == 10 && digits[0] == '5' {
		digits = "90" + digits
	}

	return digits
}

// FormatPrice formats price for display
func FormatPrice(price float64) string {
	return fmt.Sprintf("%.2f TL", price)
}
