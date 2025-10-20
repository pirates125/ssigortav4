package repo

import (
	"fmt"
	"log"

	"eesigorta/backend/internal/config"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

type Repository struct {
	db *gorm.DB
}

func NewRepository(cfg *config.Config) (*Repository, error) {
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		cfg.Database.Host,
		cfg.Database.Port,
		cfg.Database.User,
		cfg.Database.Password,
		cfg.Database.DBName,
		cfg.Database.SSLMode,
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	// Auto-migrate tables
	if err := db.AutoMigrate(
		&User{},
		&Branch{},
		&Agent{},
		&Customer{},
		&Product{},
		&Quote{},
		&ScrapedQuote{},
		&Policy{},
		&Account{},
		&Payment{},
		&AuditLog{},
		&ScraperTarget{},
		&ScraperRun{},
		&ScrapedRow{},
		&Permission{},
		&Role{},
		&RolePermission{},
	); err != nil {
		return nil, fmt.Errorf("failed to migrate database: %w", err)
	}

	log.Println("Database connected and migrated successfully")

	return &Repository{db: db}, nil
}

func (r *Repository) DB() *gorm.DB {
	return r.db
}

func (r *Repository) Close() error {
	sqlDB, err := r.db.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}

// Quote methods
func (r *Repository) GetQuotes(page, pageSize int) ([]Quote, int64, error) {
	var quotes []Quote
	var total int64

	offset := (page - 1) * pageSize

	if err := r.db.Model(&Quote{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if err := r.db.Preload("Customer").Preload("Product").Preload("Agent").
		Offset(offset).Limit(pageSize).Order("created_at DESC").Find(&quotes).Error; err != nil {
		return nil, 0, err
	}

	return quotes, total, nil
}

func (r *Repository) GetQuoteByID(id uint) (*Quote, error) {
	var quote Quote
	if err := r.db.Preload("Customer").Preload("Product").Preload("Agent").
		First(&quote, id).Error; err != nil {
		return nil, err
	}
	return &quote, nil
}

func (r *Repository) CreateQuote(quote *Quote) error {
	return r.db.Create(quote).Error
}

func (r *Repository) UpdateQuote(quote *Quote) error {
	return r.db.Save(quote).Error
}

func (r *Repository) DeleteQuote(id uint) error {
	return r.db.Delete(&Quote{}, id).Error
}

// ScrapedQuote methods
func (r *Repository) GetScrapedQuotesByQuoteID(quoteID uint) ([]ScrapedQuote, error) {
	var scrapedQuotes []ScrapedQuote
	if err := r.db.Where("quote_id = ?", quoteID).Order("final_price ASC").Find(&scrapedQuotes).Error; err != nil {
		return nil, err
	}
	return scrapedQuotes, nil
}

func (r *Repository) GetScrapedQuoteByID(id uint) (*ScrapedQuote, error) {
	var scrapedQuote ScrapedQuote
	if err := r.db.First(&scrapedQuote, id).Error; err != nil {
		return nil, err
	}
	return &scrapedQuote, nil
}

func (r *Repository) CreateScrapedQuote(scrapedQuote *ScrapedQuote) error {
	return r.db.Create(scrapedQuote).Error
}

// Policy methods
func (r *Repository) GetPolicies(page, pageSize int) ([]Policy, int64, error) {
	var policies []Policy
	var total int64

	offset := (page - 1) * pageSize

	if err := r.db.Model(&Policy{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if err := r.db.Preload("Customer").Preload("Product").Preload("Agent").
		Offset(offset).Limit(pageSize).Order("created_at DESC").Find(&policies).Error; err != nil {
		return nil, 0, err
	}

	return policies, total, nil
}

func (r *Repository) GetPolicyByID(id uint) (*Policy, error) {
	var policy Policy
	if err := r.db.Preload("Customer").Preload("Product").Preload("Agent").
		First(&policy, id).Error; err != nil {
		return nil, err
	}
	return &policy, nil
}

func (r *Repository) CreatePolicy(policy *Policy) error {
	return r.db.Create(policy).Error
}

func (r *Repository) UpdatePolicy(policy *Policy) error {
	return r.db.Save(policy).Error
}

// ScraperTarget methods
func (r *Repository) GetActiveScraperTargets() ([]*ScraperTarget, error) {
	var targets []*ScraperTarget
	if err := r.db.Where("is_active = ?", true).Find(&targets).Error; err != nil {
		return nil, err
	}
	return targets, nil
}

func (r *Repository) GetScraperTargets() ([]*ScraperTarget, error) {
	var targets []*ScraperTarget
	if err := r.db.Find(&targets).Error; err != nil {
		return nil, err
	}
	return targets, nil
}

func (r *Repository) GetScraperTargetByID(id uint) (*ScraperTarget, error) {
	var target ScraperTarget
	if err := r.db.First(&target, id).Error; err != nil {
		return nil, err
	}
	return &target, nil
}

func (r *Repository) CreateScraperTarget(target *ScraperTarget) error {
	return r.db.Create(target).Error
}

func (r *Repository) UpdateScraperTarget(target *ScraperTarget) error {
	return r.db.Save(target).Error
}

func (r *Repository) DeleteScraperTarget(id uint) error {
	return r.db.Delete(&ScraperTarget{}, id).Error
}

// Customer methods
func (r *Repository) GetCustomers(page, pageSize int) ([]Customer, int64, error) {
	var customers []Customer
	var total int64

	offset := (page - 1) * pageSize

	if err := r.db.Model(&Customer{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if err := r.db.Preload("Agent").Preload("Branch").
		Offset(offset).Limit(pageSize).Order("created_at DESC").Find(&customers).Error; err != nil {
		return nil, 0, err
	}

	return customers, total, nil
}

func (r *Repository) GetCustomerByID(id uint) (*Customer, error) {
	var customer Customer
	if err := r.db.Preload("Agent").Preload("Branch").
		First(&customer, id).Error; err != nil {
		return nil, err
	}
	return &customer, nil
}

func (r *Repository) CreateCustomer(customer *Customer) error {
	return r.db.Create(customer).Error
}

func (r *Repository) UpdateCustomer(customer *Customer) error {
	return r.db.Save(customer).Error
}

func (r *Repository) DeleteCustomer(id uint) error {
	return r.db.Delete(&Customer{}, id).Error
}

// Branch methods
func (r *Repository) GetBranches(page, pageSize int) ([]Branch, int64, error) {
	var branches []Branch
	var total int64

	offset := (page - 1) * pageSize

	if err := r.db.Model(&Branch{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if err := r.db.Preload("Manager").
		Offset(offset).Limit(pageSize).Order("created_at DESC").Find(&branches).Error; err != nil {
		return nil, 0, err
	}

	return branches, total, nil
}

func (r *Repository) GetBranchByID(id uint) (*Branch, error) {
	var branch Branch
	if err := r.db.Preload("Manager").First(&branch, id).Error; err != nil {
		return nil, err
	}
	return &branch, nil
}

func (r *Repository) CreateBranch(branch *Branch) error {
	return r.db.Create(branch).Error
}

func (r *Repository) UpdateBranch(branch *Branch) error {
	return r.db.Save(branch).Error
}

func (r *Repository) DeleteBranch(id uint) error {
	return r.db.Delete(&Branch{}, id).Error
}

// Agent methods
func (r *Repository) GetAgents(page, pageSize int) ([]Agent, int64, error) {
	var agents []Agent
	var total int64

	offset := (page - 1) * pageSize

	if err := r.db.Model(&Agent{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if err := r.db.Preload("Branch").
		Offset(offset).Limit(pageSize).Order("created_at DESC").Find(&agents).Error; err != nil {
		return nil, 0, err
	}

	return agents, total, nil
}

func (r *Repository) GetAgentByID(id uint) (*Agent, error) {
	var agent Agent
	if err := r.db.Preload("Branch").First(&agent, id).Error; err != nil {
		return nil, err
	}
	return &agent, nil
}

func (r *Repository) CreateAgent(agent *Agent) error {
	return r.db.Create(agent).Error
}

func (r *Repository) UpdateAgent(agent *Agent) error {
	return r.db.Save(agent).Error
}

func (r *Repository) DeleteAgent(id uint) error {
	return r.db.Delete(&Agent{}, id).Error
}

