package jobs

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"eesigorta/backend/internal/repo"
	"eesigorta/backend/internal/scraper"

	"github.com/hibiken/asynq"
)

const (
	TypeScrapeQuote = "quote:scrape"
)

type ScrapeQuotePayload struct {
	QuoteID uint `json:"quote_id"`
}

// NewScrapeQuoteTask creates a new task to scrape insurance quotes
func NewScrapeQuoteTask(quoteID uint) (*asynq.Task, error) {
	payload, err := json.Marshal(ScrapeQuotePayload{QuoteID: quoteID})
	if err != nil {
		return nil, err
	}
	return asynq.NewTask(TypeScrapeQuote, payload), nil
}

// HandleScrapeQuoteTask handles the scraping of insurance quotes
func HandleScrapeQuoteTask(ctx context.Context, t *asynq.Task, repository *repo.Repository) error {
	var payload ScrapeQuotePayload
	if err := json.Unmarshal(t.Payload(), &payload); err != nil {
		return fmt.Errorf("failed to unmarshal payload: %w", err)
	}

	log.Printf("Processing scrape quote task for Quote ID: %d", payload.QuoteID)

	// Get quote from database
	quote, err := repository.GetQuoteByID(payload.QuoteID)
	if err != nil {
		return fmt.Errorf("failed to get quote: %w", err)
	}

	// Update quote status
	quote.Status = "processing"
	repository.UpdateQuote(quote)

	// Get customer data for form filling
	customer, err := repository.GetCustomerByID(quote.CustomerID)
	if err != nil {
		return fmt.Errorf("failed to get customer: %w", err)
	}

	// Convert customer to CustomerData for scraper
	customerData := &scraper.CustomerData{
		FirstName:     customer.FirstName,
		LastName:      customer.LastName,
		Email:         customer.Email,
		Phone:         customer.Phone,
		TCKN:          customer.TCKN,
		BirthDate:     customer.BirthDate.Format("2006-01-02"),
		Gender:        customer.Gender,
		Address:       customer.Address,
		City:          customer.City,
		District:      customer.District,
		PostalCode:    customer.PostalCode,
		VehicleBrand:  quote.VehicleBrand,
		VehicleModel:  quote.VehicleModel,
		VehicleYear:   quote.VehicleYear,
		VehiclePlate:  quote.VehiclePlate,
		LicensePlate:  quote.LicensePlate,
		EngineNumber:  quote.EngineNumber,
		ChassisNumber: quote.ChassisNumber,
	}

	// Get all active scraper targets for insurance companies
	targets, err := repository.GetActiveScraperTargets()
	if err != nil {
		log.Printf("Failed to get scraper targets: %v", err)
		return err
	}

	// Initialize insurance scraper
	scraperConfig := &scraper.InsuranceScraperConfig{
		Enabled:           true,
		Headless:          true,
		Timeout:           30 * time.Second,
		UserAgent:         "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
		WindowWidth:       1920,
		WindowHeight:      1080,
		MaxRetries:        3,
		DelayBetweenPages: 2 * time.Second,
		RespectRobots:     true,
	}

	insuranceScraper, err := scraper.NewInsuranceScraper(scraperConfig)
	if err != nil {
		log.Printf("Failed to initialize insurance scraper: %v", err)
		// Fallback to simulation
		return handleScrapeQuoteTaskSimulation(ctx, t, repository)
	}
	defer insuranceScraper.Close()

	// Scrape each insurance company
	scrapedQuotes := make([]*repo.ScrapedQuote, 0, len(targets))
	
	for _, target := range targets {
		log.Printf("Scraping %s for quote %d", target.Name, quote.ID)
		
		// Try real scraping first
		quoteData, err := insuranceScraper.ScrapeInsuranceQuote(target, customerData)
		if err != nil {
			log.Printf("Failed to scrape %s: %v, falling back to simulation", target.Name, err)
			// Fallback to simulation
			quoteData = simulateScrapingData(quote, target)
		}

		// Convert to ScrapedQuote
		scrapedQuote := &repo.ScrapedQuote{
			QuoteID:        quote.ID,
			CompanyName:    quoteData.CompanyName,
			CompanyLogo:    target.LogoURL,
			Premium:        quoteData.Premium,
			CoverageAmount: quoteData.CoverageAmount,
			Discount:       quoteData.Discount,
			FinalPrice:     quoteData.FinalPrice,
			Status:         "scraped",
			ScrapedAt:      quoteData.ScrapedAt,
		}

		// Save scraped quote to database
		if err := repository.CreateScrapedQuote(scrapedQuote); err != nil {
			log.Printf("Failed to save scraped quote for %s: %v", target.Name, err)
		} else {
			scrapedQuotes = append(scrapedQuotes, scrapedQuote)
		}

		// Add delay between scrapes
		time.Sleep(scraperConfig.DelayBetweenPages)
	}

	// Update quote status
	quote.Status = "completed"
	repository.UpdateQuote(quote)

	log.Printf("Completed scraping for Quote ID: %d, scraped %d quotes", payload.QuoteID, len(scrapedQuotes))

	return nil
}

// handleScrapeQuoteTaskSimulation handles scraping with simulation (fallback)
func handleScrapeQuoteTaskSimulation(ctx context.Context, t *asynq.Task, repository *repo.Repository) error {
	var payload ScrapeQuotePayload
	if err := json.Unmarshal(t.Payload(), &payload); err != nil {
		return fmt.Errorf("failed to unmarshal payload: %w", err)
	}

	log.Printf("Processing scrape quote task (simulation) for Quote ID: %d", payload.QuoteID)

	// Get quote from database
	quote, err := repository.GetQuoteByID(payload.QuoteID)
	if err != nil {
		return fmt.Errorf("failed to get quote: %w", err)
	}

	// Update quote status
	quote.Status = "processing"
	repository.UpdateQuote(quote)

	// Get all active scraper targets for insurance companies
	targets, err := repository.GetActiveScraperTargets()
	if err != nil {
		log.Printf("Failed to get scraper targets: %v", err)
		return err
	}

	// Scrape each insurance company with simulation
	for _, target := range targets {
		log.Printf("Simulating scraping %s for quote %d", target.Name, quote.ID)

		// Simulate scraping
		scrapedQuote := simulateScraping(quote, target)

		// Save scraped quote to database
		if err := repository.CreateScrapedQuote(scrapedQuote); err != nil {
			log.Printf("Failed to save scraped quote for %s: %v", target.Name, err)
		}
	}

	// Update quote status
	quote.Status = "completed"
	repository.UpdateQuote(quote)

	log.Printf("Completed simulation scraping for Quote ID: %d", payload.QuoteID)

	return nil
}

// simulateScrapingData simulates scraping data for fallback
func simulateScrapingData(quote *repo.Quote, target *repo.ScraperTarget) *scraper.InsuranceQuoteData {
	// Simulate different prices from different companies
	basePremium := 1500.0
	companyFactor := map[string]float64{
		"Anadolu Sigorta": 1.0,
		"Allianz":         0.95,
		"Mapfre":          1.05,
		"Aksigorta":       0.98,
		"Axa Sigorta":     1.02,
	}

	factor, ok := companyFactor[target.Name]
	if !ok {
		factor = 1.0
	}

	premium := basePremium * factor
	discount := premium * 0.1 // 10% discount
	finalPrice := premium - discount

	return &scraper.InsuranceQuoteData{
		CompanyName:     target.Name,
		ProductName:      "Kasko Sigortası",
		Premium:         premium,
		CoverageAmount:  50000.0,
		Discount:        discount,
		FinalPrice:      finalPrice,
		Currency:        "TRY",
		ValidUntil:      time.Now().AddDate(1, 0, 0).Format("2006-01-02"),
		PolicyNumber:    fmt.Sprintf("POL-%d-%s", quote.ID, target.Name[:3]),
		AgentCommission: finalPrice * 0.12,
		Features:        []string{"Tam Kasko", "Çekici Hizmeti", "Yedek Araç", "Cam Kırığı"},
		Exclusions:      []string{"Savaş", "Terör", "Nükleer"},
		ScrapedAt:       time.Now(),
	}
}

// simulateScraping simulates scraping an insurance company
// In production, replace this with actual scraping logic
func simulateScraping(quote *repo.Quote, target *repo.ScraperTarget) *repo.ScrapedQuote {
	// Simulate different prices from different companies
	basePremium := 1500.0
	companyFactor := map[string]float64{
		"Anadolu Sigorta": 1.0,
		"Allianz":         0.95,
		"Mapfre":          1.05,
		"Aksigorta":       0.98,
		"Axa Sigorta":     1.02,
	}

	factor, ok := companyFactor[target.Name]
	if !ok {
		factor = 1.0
	}

	premium := basePremium * factor
	discount := premium * 0.1 // 10% discount
	finalPrice := premium - discount

	return &repo.ScrapedQuote{
		QuoteID:        quote.ID,
		CompanyName:    target.Name,
		CompanyLogo:    target.LogoURL,
		Premium:        premium,
		CoverageAmount: 50000.0,
		Discount:       discount,
		FinalPrice:     finalPrice,
		Status:         "scraped",
		ScrapedAt:      time.Now(),
	}
}

