package scraper

import (
	"crypto/md5"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"

	"eesigorta/backend/internal/config"
	"eesigorta/backend/internal/repo"

	"github.com/gocolly/colly/v2"
	"github.com/gocolly/colly/v2/debug"
)

type ScraperManager struct {
	config     *config.ScraperConfig
	db         *repo.Repository
	collectors map[string]*colly.Collector
}

type ScrapeResult struct {
	TargetID       uint                   `json:"target_id"`
	URL            string                 `json:"url"`
	Type           string                 `json:"type"`
	RawData        map[string]interface{} `json:"raw_data"`
	NormalizedData map[string]interface{} `json:"normalized_data"`
	HashKey        string                 `json:"hash_key"`
	Timestamp      time.Time              `json:"timestamp"`
}

type ScrapeStats struct {
	TotalPages    int           `json:"total_pages"`
	SuccessPages  int           `json:"success_pages"`
	ErrorPages    int           `json:"error_pages"`
	Duration      time.Duration `json:"duration"`
	DataExtracted int           `json:"data_extracted"`
}

func NewScraperManager(cfg *config.ScraperConfig, db *repo.Repository) *ScraperManager {
	return &ScraperManager{
		config:     cfg,
		db:         db,
		collectors: make(map[string]*colly.Collector),
	}
}

func (sm *ScraperManager) CreateCollector(target *repo.ScraperTarget) (*colly.Collector, error) {
	c := colly.NewCollector(
		colly.AllowedDomains(extractDomain(target.BaseURL)),
	)

	// Set user agent
	c.UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"

	// Set delay
	c.Limit(&colly.LimitRule{
		DomainGlob:  "*",
		Parallelism: 1,
		Delay:       time.Duration(sm.config.DefaultDelayMs) * time.Millisecond,
	})

	// Set debug if needed
	if sm.config.DefaultDelayMs < 1000 {
		c.OnRequest(func(r *colly.Request) {
			log.Printf("Visiting: %s", r.URL)
		})
		c.SetDebugger( &debug.LogDebugger{})
	}

	// Set custom headers
	if target.HeadersJSON != "" {
		var headers map[string]string
		if err := json.Unmarshal([]byte(target.HeadersJSON), &headers); err == nil {
			c.OnRequest(func(r *colly.Request) {
				for key, value := range headers {
					r.Headers.Set(key, value)
				}
			})
		}
	}

	// Set cookies
	if target.CookiesJSON != "" {
		var cookies map[string]string
		if err := json.Unmarshal([]byte(target.CookiesJSON), &cookies); err == nil {
			c.OnRequest(func(r *colly.Request) {
				for name, value := range cookies {
					r.Headers.Set("Cookie", fmt.Sprintf("%s=%s", name, value))
				}
			})
		}
	}

	// Respect robots.txt if configured
	if sm.config.RespectRobots {
		c.OnRequest(func(r *colly.Request) {
			// Check robots.txt (simplified implementation)
			robotsURL := fmt.Sprintf("%s://%s/robots.txt", r.URL.Scheme, r.URL.Host)
			if resp, err := http.Get(robotsURL); err == nil {
				resp.Body.Close()
				// In a real implementation, parse robots.txt and check rules
			}
		})
	}

	// Error handling
	c.OnError(func(r *colly.Response, err error) {
		log.Printf("Error scraping %s: %v", r.Request.URL, err)
	})

	// Rate limiting
	c.OnRequest(func(r *colly.Request) {
		time.Sleep(time.Duration(sm.config.DefaultDelayMs) * time.Millisecond)
	})

	return c, nil
}

func (sm *ScraperManager) ScrapeTarget(targetID uint) (*ScrapeStats, error) {
	// Get target from database
	var target repo.ScraperTarget
	err := sm.db.DB().First(&target, targetID).Error
	if err != nil {
		return nil, fmt.Errorf("target not found: %w", err)
	}

	if !target.Enabled {
		return nil, fmt.Errorf("target is disabled")
	}

	// Create scraper run record
	run := repo.ScraperRun{
		TargetID:  targetID,
		Status:    "running",
		StartedAt: &[]time.Time{time.Now()}[0],
	}
	sm.db.DB().Create(&run)

	stats := &ScrapeStats{
		TotalPages:   0,
		SuccessPages: 0,
		ErrorPages:   0,
		DataExtracted: 0,
	}

	startTime := time.Now()

	// Create collector
	collector, err := sm.CreateCollector(&target)
	if err != nil {
		run.Status = "failed"
		run.ErrorMsg = err.Error()
		run.FinishedAt = &[]time.Time{time.Now()}[0]
		sm.db.DB().Save(&run)
		return nil, err
	}

	// Define selectors based on target type
	selectors := sm.getSelectorsForTarget(&target)

	// Set up data extraction
	collector.OnHTML("html", func(e *colly.HTMLElement) {
		stats.TotalPages++
		
		// Extract data based on selectors
		rawData := make(map[string]interface{})
		normalizedData := make(map[string]interface{})

		for field, selector := range selectors {
			value := e.ChildText(selector)
			if value != "" {
				rawData[field] = value
				normalizedData[field] = sm.normalizeValue(field, value)
			}
		}

		// If we have data, save it
		if len(rawData) > 0 {
			hashKey := sm.generateHashKey(target.BaseURL, rawData)
			
			// Check if data already exists
			var existingRow repo.ScrapedRow
			err := sm.db.DB().Where("hash_key = ?", hashKey).First(&existingRow).Error
			if err != nil {
				// Create new scraped row
				rawJSON, _ := json.Marshal(rawData)
				normalizedJSON, _ := json.Marshal(normalizedData)

				scrapedRow := repo.ScrapedRow{
					TargetID:       targetID,
					HashKey:        hashKey,
					URL:            e.Request.URL.String(),
					Type:           target.Name,
					RawJSON:        string(rawJSON),
					NormalizedJSON: string(normalizedJSON),
				}

				sm.db.DB().Create(&scrapedRow)
				stats.DataExtracted++
			}
			stats.SuccessPages++
		}
	})

	// Handle errors
	collector.OnError(func(r *colly.Response, err error) {
		stats.ErrorPages++
		log.Printf("Error scraping %s: %v", r.Request.URL, err)
	})

	// Start scraping
	err = collector.Visit(target.BaseURL)
	if err != nil {
		run.Status = "failed"
		run.ErrorMsg = err.Error()
		run.FinishedAt = &[]time.Time{time.Now()}[0]
		sm.db.DB().Save(&run)
		return nil, err
	}

	// Update run status
	stats.Duration = time.Since(startTime)
	run.Status = "completed"
	run.FinishedAt = &[]time.Time{time.Now()}[0]
	
	statsJSON, _ := json.Marshal(stats)
	run.StatsJSON = string(statsJSON)
	
	sm.db.DB().Save(&run)

	return stats, nil
}

func (sm *ScraperManager) getSelectorsForTarget(target *repo.ScraperTarget) map[string]string {
	// Default selectors for different types of insurance websites
	defaultSelectors := map[string]map[string]string{
		"product": {
			"name":        "h1, .product-title, .product-name",
			"description": ".product-description, .description, p",
			"price":       ".price, .premium, .cost",
			"features":    ".features, .benefits, ul",
		},
		"contact": {
			"phone":   ".phone, .tel, [href^='tel:']",
			"email":   ".email, .mail, [href^='mailto:']",
			"address": ".address, .location, .contact-address",
		},
		"news": {
			"title":   "h1, h2, .title, .news-title",
			"content": ".content, .news-content, .article-content",
			"date":    ".date, .published, .news-date",
		},
	}

	// Try to parse custom selectors from target
	if target.SelectorJSON != "" {
		var customSelectors map[string]string
		if err := json.Unmarshal([]byte(target.SelectorJSON), &customSelectors); err == nil {
			return customSelectors
		}
	}

	// Return default selectors based on target name
	for key, selectors := range defaultSelectors {
		if strings.Contains(strings.ToLower(target.Name), key) {
			return selectors
		}
	}

	// Default fallback
	return map[string]string{
		"title":   "h1, h2, .title",
		"content": ".content, p",
		"link":    "a[href]",
	}
}

func (sm *ScraperManager) normalizeValue(field, value string) interface{} {
	value = strings.TrimSpace(value)
	
	switch field {
	case "price", "premium", "cost":
		// Extract numeric value from price strings
		// This is a simplified implementation
		return value
	case "phone":
		// Normalize phone numbers
		return strings.ReplaceAll(value, " ", "")
	case "email":
		// Normalize email
		return strings.ToLower(value)
	case "date":
		// Try to parse date
		if t, err := time.Parse("2006-01-02", value); err == nil {
			return t.Format("2006-01-02")
		}
		return value
	default:
		return value
	}
}

func (sm *ScraperManager) generateHashKey(baseURL string, data map[string]interface{}) string {
	// Create a hash key based on URL and data content
	content := baseURL
	for key, value := range data {
		content += fmt.Sprintf("%s:%v", key, value)
	}
	
	hash := md5.Sum([]byte(content))
	return fmt.Sprintf("%x", hash)
}

func extractDomain(urlStr string) string {
	u, err := url.Parse(urlStr)
	if err != nil {
		return ""
	}
	return u.Host
}

// GetScrapeTargets returns all enabled scrape targets
func (sm *ScraperManager) GetScrapeTargets() ([]repo.ScraperTarget, error) {
	var targets []repo.ScraperTarget
	err := sm.db.DB().Where("enabled = ?", true).Find(&targets).Error
	return targets, err
}

// GetScrapeRuns returns scrape run history
func (sm *ScraperManager) GetScrapeRuns(limit int) ([]repo.ScraperRun, error) {
	var runs []repo.ScraperRun
	query := sm.db.DB().Preload("Target").Order("created_at DESC")
	if limit > 0 {
		query = query.Limit(limit)
	}
	err := query.Find(&runs).Error
	return runs, err
}
