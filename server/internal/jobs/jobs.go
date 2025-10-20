package jobs

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"eesigorta/backend/internal/config"
	"eesigorta/backend/internal/repo"
	"eesigorta/backend/internal/scraper"

	"github.com/hibiken/asynq"
)

// Job types
const (
	TypeScrapeTarget    = "scrape:target"
	TypeScrapeAll       = "scrape:all"
	TypeEnrichData      = "scrape:enrich"
	TypeDedupeData      = "scrape:dedupe"
	TypeExportCSV       = "export:csv"
	TypeCleanupOldData  = "cleanup:old_data"
)

// Job payloads
type ScrapeTargetPayload struct {
	TargetID uint `json:"target_id"`
}

type ScrapeAllPayload struct {
	Force bool `json:"force"`
}

type EnrichDataPayload struct {
	TargetID uint `json:"target_id"`
}

type DedupeDataPayload struct {
	TargetID uint `json:"target_id"`
}

type ExportCSVPayload struct {
	Type     string                 `json:"type"`
	Filters  map[string]interface{} `json:"filters"`
	UserID   uint                   `json:"user_id"`
}

type CleanupOldDataPayload struct {
	DaysOld int `json:"days_old"`
}

type JobManager struct {
	client    *asynq.Client
	server    *asynq.Server
	repo      *repo.Repository
	scraper   *scraper.ScraperManager
	headless  *scraper.HeadlessScraper
	config    *config.Config
}

func NewJobManager(cfg *config.Config, repo *repo.Repository, scraperMgr *scraper.ScraperManager) *JobManager {
	// Redis client for asynq
	redisOpt := asynq.RedisClientOpt{
		Addr:     cfg.Redis.Addr,
		Password: cfg.Redis.Password,
		DB:       cfg.Redis.DB,
	}

	client := asynq.NewClient(redisOpt)
	server := asynq.NewServer(redisOpt, asynq.Config{
		Concurrency: 10,
		Queues: map[string]int{
			"critical": 6,
			"default":  3,
			"low":      1,
		},
		RetryDelayFunc: asynq.DefaultRetryDelayFunc,
	})

	// Initialize headless scraper
	headlessCfg := &scraper.HeadlessConfig{
		Enabled:      cfg.Scraper.HeadlessEnabled,
		Headless:     true,
		Timeout:      30 * time.Second,
		UserAgent:    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
		WindowWidth:  1920,
		WindowHeight: 1080,
	}
	headlessScraper, _ := scraper.NewHeadlessScraper(headlessCfg)

	return &JobManager{
		client:   client,
		server:   server,
		repo:    repo,
		scraper: scraperMgr,
		headless: headlessScraper,
		config:  cfg,
	}
}

func (jm *JobManager) StartWorker() error {
	mux := asynq.NewServeMux()

	// Register handlers
	mux.HandleFunc(TypeScrapeTarget, jm.HandleScrapeTarget)
	mux.HandleFunc(TypeScrapeAll, jm.HandleScrapeAll)
	mux.HandleFunc(TypeEnrichData, jm.HandleEnrichData)
	mux.HandleFunc(TypeDedupeData, jm.HandleDedupeData)
	mux.HandleFunc(TypeExportCSV, jm.HandleExportCSV)
	mux.HandleFunc(TypeCleanupOldData, jm.HandleCleanupOldData)

	log.Println("Starting job worker...")
	return jm.server.Run(mux)
}

func (jm *JobManager) Stop() error {
	jm.client.Close()
	jm.server.Shutdown()
	return jm.headless.Close()
}

// Enqueue jobs
func (jm *JobManager) EnqueueScrapeTarget(targetID uint) error {
	payload := ScrapeTargetPayload{TargetID: targetID}
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	task := asynq.NewTask(TypeScrapeTarget, payloadBytes)
	_, err = jm.client.Enqueue(task, asynq.Queue("default"))
	return err
}

func (jm *JobManager) EnqueueScrapeAll(force bool) error {
	payload := ScrapeAllPayload{Force: force}
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	task := asynq.NewTask(TypeScrapeAll, payloadBytes)
	_, err = jm.client.Enqueue(task, asynq.Queue("default"))
	return err
}

func (jm *JobManager) EnqueueEnrichData(targetID uint) error {
	payload := EnrichDataPayload{TargetID: targetID}
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	task := asynq.NewTask(TypeEnrichData, payloadBytes)
	_, err = jm.client.Enqueue(task, asynq.Queue("low"))
	return err
}

func (jm *JobManager) EnqueueDedupeData(targetID uint) error {
	payload := DedupeDataPayload{TargetID: targetID}
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	task := asynq.NewTask(TypeDedupeData, payloadBytes)
	_, err = jm.client.Enqueue(task, asynq.Queue("low"))
	return err
}

func (jm *JobManager) EnqueueExportCSV(exportType string, filters map[string]interface{}, userID uint) error {
	payload := ExportCSVPayload{
		Type:    exportType,
		Filters: filters,
		UserID:  userID,
	}
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	task := asynq.NewTask(TypeExportCSV, payloadBytes)
	_, err = jm.client.Enqueue(task, asynq.Queue("low"))
	return err
}

// Job handlers
func (jm *JobManager) HandleScrapeTarget(ctx context.Context, t *asynq.Task) error {
	var payload ScrapeTargetPayload
	if err := json.Unmarshal(t.Payload(), &payload); err != nil {
		return fmt.Errorf("failed to unmarshal payload: %w", err)
	}

	log.Printf("Starting scrape job for target ID: %d", payload.TargetID)

	// Get target
	var target repo.ScraperTarget
	err := jm.repo.DB().First(&target, payload.TargetID).Error
	if err != nil {
		return fmt.Errorf("target not found: %w", err)
	}

	// Choose scraper based on target configuration
	var stats *scraper.ScrapeStats
	if target.UseHeadless {
		stats, err = jm.headless.ScrapeTarget(&target)
	} else {
		stats, err = jm.scraper.ScrapeTarget(payload.TargetID)
	}

	if err != nil {
		log.Printf("Scrape job failed for target %d: %v", payload.TargetID, err)
		return err
	}

	log.Printf("Scrape job completed for target %d: %+v", payload.TargetID, stats)

	// Enqueue follow-up jobs
	jm.EnqueueEnrichData(payload.TargetID)
	jm.EnqueueDedupeData(payload.TargetID)

	return nil
}

func (jm *JobManager) HandleScrapeAll(ctx context.Context, t *asynq.Task) error {
	var payload ScrapeAllPayload
	if err := json.Unmarshal(t.Payload(), &payload); err != nil {
		return fmt.Errorf("failed to unmarshal payload: %w", err)
	}

	log.Printf("Starting scrape all job (force: %v)", payload.Force)

	targets, err := jm.scraper.GetScrapeTargets()
	if err != nil {
		return fmt.Errorf("failed to get targets: %w", err)
	}

	for _, target := range targets {
		if err := jm.EnqueueScrapeTarget(target.ID); err != nil {
			log.Printf("Failed to enqueue target %d: %v", target.ID, err)
		}
	}

	log.Printf("Enqueued %d scrape jobs", len(targets))
	return nil
}

func (jm *JobManager) HandleEnrichData(ctx context.Context, t *asynq.Task) error {
	var payload EnrichDataPayload
	if err := json.Unmarshal(t.Payload(), &payload); err != nil {
		return fmt.Errorf("failed to unmarshal payload: %w", err)
	}

	log.Printf("Starting data enrichment for target ID: %d", payload.TargetID)

	// Get scraped rows for the target
	var rows []repo.ScrapedRow
	err := jm.repo.DB().Where("target_id = ?", payload.TargetID).Find(&rows).Error
	if err != nil {
		return fmt.Errorf("failed to get scraped rows: %w", err)
	}

	enrichedCount := 0
	for _, row := range rows {
		// Parse normalized data
		var normalizedData map[string]interface{}
		if err := json.Unmarshal([]byte(row.NormalizedJSON), &normalizedData); err != nil {
			continue
		}

		// Enrich with additional data (simplified)
		enriched := make(map[string]interface{})
		for key, value := range normalizedData {
			enriched[key] = value
		}

		// Add enrichment
		if city, ok := enriched["city"].(string); ok && city != "" {
			enriched["city_normalized"] = jm.normalizeCity(city)
		}

		// Update row
		enrichedJSON, _ := json.Marshal(enriched)
		row.NormalizedJSON = string(enrichedJSON)
		jm.repo.DB().Save(&row)
		enrichedCount++
	}

	log.Printf("Enriched %d rows for target %d", enrichedCount, payload.TargetID)
	return nil
}

func (jm *JobManager) HandleDedupeData(ctx context.Context, t *asynq.Task) error {
	var payload DedupeDataPayload
	if err := json.Unmarshal(t.Payload(), &payload); err != nil {
		return fmt.Errorf("failed to unmarshal payload: %w", err)
	}

	log.Printf("Starting deduplication for target ID: %d", payload.TargetID)

	// Find duplicate hash keys
	var duplicates []struct {
		HashKey string
		Count   int64
	}

	err := jm.repo.DB().Table("scraped_rows").
		Select("hash_key, COUNT(*) as count").
		Where("target_id = ?", payload.TargetID).
		Group("hash_key").
		Having("COUNT(*) > 1").
		Scan(&duplicates).Error

	if err != nil {
		return fmt.Errorf("failed to find duplicates: %w", err)
	}

	removedCount := 0
	for _, dup := range duplicates {
		// Keep the first row, remove others
		var rows []repo.ScrapedRow
		err := jm.repo.DB().Where("target_id = ? AND hash_key = ?", payload.TargetID, dup.HashKey).
			Order("created_at ASC").
			Find(&rows).Error

		if err != nil {
			continue
		}

		// Remove duplicates (keep first)
		for i := 1; i < len(rows); i++ {
			jm.repo.DB().Delete(&rows[i])
			removedCount++
		}
	}

	log.Printf("Removed %d duplicate rows for target %d", removedCount, payload.TargetID)
	return nil
}

func (jm *JobManager) HandleExportCSV(ctx context.Context, t *asynq.Task) error {
	var payload ExportCSVPayload
	if err := json.Unmarshal(t.Payload(), &payload); err != nil {
		return fmt.Errorf("failed to unmarshal payload: %w", err)
	}

	log.Printf("Starting CSV export for type: %s", payload.Type)

	// This is a simplified implementation
	// In a real implementation, you would generate CSV files and store them
	// For now, just log the export request

	log.Printf("CSV export completed for user %d, type %s", payload.UserID, payload.Type)
	return nil
}

func (jm *JobManager) HandleCleanupOldData(ctx context.Context, t *asynq.Task) error {
	var payload CleanupOldDataPayload
	if err := json.Unmarshal(t.Payload(), &payload); err != nil {
		return fmt.Errorf("failed to unmarshal payload: %w", err)
	}

	log.Printf("Starting cleanup of data older than %d days", payload.DaysOld)

	cutoffDate := time.Now().AddDate(0, 0, -payload.DaysOld)

	// Clean up old scraped rows
	result := jm.repo.DB().Where("created_at < ?", cutoffDate).Delete(&repo.ScrapedRow{})
	if result.Error != nil {
		return fmt.Errorf("failed to cleanup scraped rows: %w", result.Error)
	}

	// Clean up old scraper runs
	result = jm.repo.DB().Where("created_at < ?", cutoffDate).Delete(&repo.ScraperRun{})
	if result.Error != nil {
		return fmt.Errorf("failed to cleanup scraper runs: %w", result.Error)
	}

	log.Printf("Cleanup completed: removed %d scraped rows and %d scraper runs", 
		result.RowsAffected, result.RowsAffected)

	return nil
}

// Helper functions
func (jm *JobManager) normalizeCity(city string) string {
	// Simple city normalization
	cityMap := map[string]string{
		"istanbul": "İstanbul",
		"ankara":   "Ankara",
		"izmir":    "İzmir",
		"bursa":    "Bursa",
		"antalya": "Antalya",
	}

	if normalized, exists := cityMap[city]; exists {
		return normalized
	}
	return city
}

// Schedule periodic jobs
func (jm *JobManager) SchedulePeriodicJobs() error {
	// Schedule daily scrape all job at 2 AM
	_, err := jm.client.Enqueue(
		asynq.NewTask(TypeScrapeAll, []byte(`{"force": false}`)),
		asynq.ProcessIn(24*time.Hour),
		asynq.Queue("default"),
	)
	if err != nil {
		return err
	}

	// Schedule weekly cleanup job
	_, err = jm.client.Enqueue(
		asynq.NewTask(TypeCleanupOldData, []byte(`{"days_old": 30}`)),
		asynq.ProcessIn(7*24*time.Hour),
		asynq.Queue("low"),
	)

	return err
}
