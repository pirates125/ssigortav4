package scraper

import (
	"context"
	"fmt"
	"math/rand"
	"time"

	"eesigorta/backend/internal/repo"

	"github.com/go-rod/rod"
	"github.com/go-rod/rod/lib/launcher"
)

type HeadlessScraper struct {
	browser *rod.Browser
	config  *HeadlessConfig
}

type HeadlessConfig struct {
	Enabled     bool
	Headless    bool
	Timeout     time.Duration
	UserAgent   string
	WindowWidth int
	WindowHeight int
}

func NewHeadlessScraper(cfg *HeadlessConfig) (*HeadlessScraper, error) {
	if !cfg.Enabled {
		return &HeadlessScraper{config: cfg}, nil
	}

	// Launch browser
	var browser *rod.Browser
	var err error

	if cfg.Headless {
		browser = rod.New().MustConnect()
	} else {
		// Launch with visible browser (for debugging)
		path, _ := launcher.LookPath()
		u := launcher.New().Bin(path).MustLaunch()
		browser = rod.New().ControlURL(u).MustConnect()
	}

	return &HeadlessScraper{
		browser: browser,
		config:  cfg,
	}, nil
}

func (hs *HeadlessScraper) ScrapeTarget(target *repo.ScraperTarget) (*ScrapeStats, error) {
	if !hs.config.Enabled {
		return nil, fmt.Errorf("headless scraping is disabled")
	}

	stats := &ScrapeStats{
		TotalPages:    0,
		SuccessPages:  0,
		ErrorPages:    0,
		DataExtracted: 0,
	}

	startTime := time.Now()

	// Create page
	page := hs.browser.MustPage(target.BaseURL)
	defer page.MustClose()

	// Set user agent
	if hs.config.UserAgent != "" {
		page.MustSetUserAgent(&rod.UserAgent{
			UserAgent: hs.config.UserAgent,
		})
	}

	// Set viewport
	page.MustSetViewport(&rod.Viewport{
		Width:  hs.config.WindowWidth,
		Height: hs.config.WindowHeight,
	})

	// Set timeout
	ctx, cancel := context.WithTimeout(context.Background(), hs.config.Timeout)
	defer cancel()

	// Wait for page to load
	err := page.Context(ctx).WaitLoad()
	if err != nil {
		stats.ErrorPages++
		return stats, fmt.Errorf("failed to load page: %w", err)
	}

	// Wait a bit for dynamic content
	time.Sleep(2 * time.Second)

	// Extract data using JavaScript
	data, err := hs.extractDataWithJS(page, target)
	if err != nil {
		stats.ErrorPages++
		return stats, fmt.Errorf("failed to extract data: %w", err)
	}

	if len(data) > 0 {
		stats.SuccessPages = 1
		stats.DataExtracted = len(data)
	}

	stats.TotalPages = 1
	stats.Duration = time.Since(startTime)

	return stats, nil
}

func (hs *HeadlessScraper) extractDataWithJS(page *rod.Page, target *repo.ScraperTarget) (map[string]interface{}, error) {
	// JavaScript code to extract data from the page
	jsCode := `
		(function() {
			const data = {};
			
			// Extract common elements
			const title = document.querySelector('h1, h2, .title, .product-title');
			if (title) data.title = title.textContent.trim();
			
			const description = document.querySelector('.description, .content, p');
			if (description) data.description = description.textContent.trim();
			
			const price = document.querySelector('.price, .premium, .cost, [class*="price"]');
			if (price) data.price = price.textContent.trim();
			
			const phone = document.querySelector('.phone, .tel, [href^="tel:"]');
			if (phone) data.phone = phone.textContent.trim() || phone.getAttribute('href');
			
			const email = document.querySelector('.email, .mail, [href^="mailto:"]');
			if (email) data.email = email.textContent.trim() || email.getAttribute('href');
			
			const address = document.querySelector('.address, .location, .contact-address');
			if (address) data.address = address.textContent.trim();
			
			// Extract all links
			const links = Array.from(document.querySelectorAll('a[href]')).map(a => ({
				text: a.textContent.trim(),
				href: a.href
			}));
			if (links.length > 0) data.links = links;
			
			// Extract all images
			const images = Array.from(document.querySelectorAll('img[src]')).map(img => ({
				alt: img.alt,
				src: img.src
			}));
			if (images.length > 0) data.images = images;
			
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

	return data, nil
}

func (hs *HeadlessScraper) Close() error {
	if hs.browser != nil {
		return hs.browser.Close()
	}
	return nil
}

// Anti-bot strategies
func (hs *HeadlessScraper) ApplyAntiBotStrategies(page *rod.Page) error {
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

// Stealth mode to avoid detection
func (hs *HeadlessScraper) EnableStealthMode(page *rod.Page) error {
	// Override navigator properties
	stealthJS := `
		Object.defineProperty(navigator, 'webdriver', {
			get: () => undefined,
		});
		
		Object.defineProperty(navigator, 'plugins', {
			get: () => [1, 2, 3, 4, 5],
		});
		
		Object.defineProperty(navigator, 'languages', {
			get: () => ['en-US', 'en'],
		});
		
		window.chrome = {
			runtime: {},
		};
	`

	_, err := page.Eval(stealthJS)
	return err
}