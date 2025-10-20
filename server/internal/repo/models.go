package repo

import (
	"time"

	"gorm.io/gorm"
)

// User represents a system user
type User struct {
	ID              uint           `json:"id" gorm:"primaryKey"`
	Email           string         `json:"email" gorm:"uniqueIndex;not null"`
	PasswordHash    string         `json:"-" gorm:"not null"`
	Role            string         `json:"role" gorm:"not null;default:'viewer'"`
	TwoFAEnabled    bool           `json:"two_fa_enabled" gorm:"default:false"`
	TwoFASecret     string         `json:"-" gorm:"column:twofa_secret"`
	IsActive        bool           `json:"is_active" gorm:"default:true"`
	LastLoginAt     *time.Time     `json:"last_login_at"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `json:"-" gorm:"index"`
}

// Branch represents a branch office
type Branch struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	Name        string         `json:"name" gorm:"not null"`
	City        string         `json:"city"`
	Address     string         `json:"address"`
	Phone       string         `json:"phone"`
	Email       string         `json:"email"`
	ManagerID   *uint          `json:"manager_id"`
	Manager     *User          `json:"manager,omitempty" gorm:"foreignKey:ManagerID"`
	IsActive    bool           `json:"is_active" gorm:"default:true"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}

// Agent represents an insurance agent
type Agent struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	BranchID  uint           `json:"branch_id" gorm:"not null"`
	Branch    Branch         `json:"branch" gorm:"foreignKey:BranchID"`
	Name      string         `json:"name" gorm:"not null"`
	Phone     string         `json:"phone"`
	Email     string         `json:"email"`
	LicenseNo string         `json:"license_no"`
	IsActive  bool           `json:"is_active" gorm:"default:true"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// Customer represents a customer
type Customer struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	TCVKN       string         `json:"tc_vkn" gorm:"uniqueIndex;not null"`
	Name        string         `json:"name" gorm:"not null"`
	Email       string         `json:"email"`
	Phone       string         `json:"phone"`
	Address     string         `json:"address"`
	City        string         `json:"city"`
	District    string         `json:"district"`
	PostalCode  string         `json:"postal_code"`
	BirthDate   *time.Time     `json:"birth_date"`
	Gender      string         `json:"gender"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}

// Product represents an insurance product
type Product struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	Type        string         `json:"type" gorm:"not null"`
	Name        string         `json:"name" gorm:"not null"`
	Description string         `json:"description"`
	ParamsJSON  string         `json:"params_json" gorm:"type:jsonb"`
	IsActive    bool           `json:"is_active" gorm:"default:true"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}

// Quote represents an insurance quote request
type Quote struct {
	ID             uint           `json:"id" gorm:"primaryKey"`
	CustomerID     uint           `json:"customer_id" gorm:"not null"`
	Customer       Customer       `json:"customer,omitempty" gorm:"foreignKey:CustomerID"`
	ProductID      uint           `json:"product_id" gorm:"not null"`
	Product        Product        `json:"product,omitempty" gorm:"foreignKey:ProductID"`
	AgentID        uint           `json:"agent_id" gorm:"not null"`
	Agent          User           `json:"agent,omitempty" gorm:"foreignKey:AgentID"`
	VehiclePlate   string         `json:"vehicle_plate"`
	VehicleYear    int            `json:"vehicle_year"`
	VehicleBrand   string         `json:"vehicle_brand"`
	VehicleModel   string         `json:"vehicle_model"`
	CoverageType   string         `json:"coverage_type" gorm:"not null"` // kasko, trafik, dask, saglik
	StartDate      string         `json:"start_date" gorm:"not null"`
	EndDate        string         `json:"end_date" gorm:"not null"`
	AdditionalInfo string         `json:"additional_info"`
	Status         string         `json:"status" gorm:"not null;default:'pending'"` // pending, processing, completed, approved
	ValidUntil     *time.Time     `json:"valid_until"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `json:"-" gorm:"index"`
}

// ScrapedQuote represents a quote scraped from an insurance company
type ScrapedQuote struct {
	ID             uint           `json:"id" gorm:"primaryKey"`
	QuoteID        uint           `json:"quote_id" gorm:"not null;index"`
	Quote          Quote          `json:"quote,omitempty" gorm:"foreignKey:QuoteID"`
	CompanyName    string         `json:"company_name" gorm:"not null"`
	CompanyLogo    string         `json:"company_logo"`
	Premium        float64        `json:"premium" gorm:"not null"`
	CoverageAmount float64        `json:"coverage_amount"`
	Discount       float64        `json:"discount" gorm:"default:0"`
	FinalPrice     float64        `json:"final_price" gorm:"not null"`
	Status         string         `json:"status" gorm:"not null;default:'scraped'"` // scraped, error
	ErrorMessage   string         `json:"error_message"`
	RawData        string         `json:"raw_data" gorm:"type:jsonb"`
	ScrapedAt      time.Time      `json:"scraped_at"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `json:"-" gorm:"index"`
}

// Policy represents an insurance policy
type Policy struct {
	ID           uint           `json:"id" gorm:"primaryKey"`
	CustomerID   uint           `json:"customer_id" gorm:"not null"`
	Customer     Customer       `json:"customer,omitempty" gorm:"foreignKey:CustomerID"`
	ProductID    uint           `json:"product_id" gorm:"not null"`
	Product      Product        `json:"product,omitempty" gorm:"foreignKey:ProductID"`
	AgentID      uint           `json:"agent_id" gorm:"not null"`
	Agent        User           `json:"agent,omitempty" gorm:"foreignKey:AgentID"`
	QuoteID      *uint          `json:"quote_id" gorm:"index"`
	Quote        *Quote         `json:"quote,omitempty" gorm:"foreignKey:QuoteID"`
	PolicyNumber string         `json:"policy_number" gorm:"uniqueIndex;not null"`
	CompanyName  string         `json:"company_name" gorm:"not null"`
	Premium      float64        `json:"premium" gorm:"not null"`
	Status       string         `json:"status" gorm:"not null;default:'active'"` // active, expired, cancelled
	StartDate    string         `json:"start_date" gorm:"not null"`
	EndDate      string         `json:"end_date" gorm:"not null"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`
}

// Account represents a branch account
type Account struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	BranchID  uint           `json:"branch_id" gorm:"not null"`
	Branch    Branch         `json:"branch" gorm:"foreignKey:BranchID"`
	Balance   float64        `json:"balance" gorm:"default:0"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// Payment represents a payment
type Payment struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	AccountID uint           `json:"account_id" gorm:"not null"`
	Account   Account        `json:"account" gorm:"foreignKey:AccountID"`
	PolicyID  *uint          `json:"policy_id"`
	Policy    *Policy        `json:"policy,omitempty" gorm:"foreignKey:PolicyID"`
	Amount    float64        `json:"amount" gorm:"not null"`
	Method    string         `json:"method" gorm:"not null"`
	PaidAt    time.Time      `json:"paid_at" gorm:"not null"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// AuditLog represents audit trail
type AuditLog struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	UserID    *uint     `json:"user_id"`
	User      *User     `json:"user,omitempty" gorm:"foreignKey:UserID"`
	Action    string    `json:"action" gorm:"not null"`
	Entity    string    `json:"entity" gorm:"not null"`
	EntityID  *uint     `json:"entity_id"`
	IP        string    `json:"ip"`
	UserAgent string    `json:"user_agent"`
	MetaJSON  string    `json:"meta_json" gorm:"type:jsonb"`
	CreatedAt time.Time `json:"created_at"`
}

// ScraperTarget represents a scraping target
type ScraperTarget struct {
	ID           uint           `json:"id" gorm:"primaryKey"`
	Name         string         `json:"name" gorm:"not null"`
	LogoURL      string         `json:"logo_url"`
	BaseURL      string         `json:"base_url" gorm:"not null"`
	Enabled      bool           `json:"enabled" gorm:"default:true"`
	IsActive     bool           `json:"is_active" gorm:"default:true"`
	UseHeadless  bool           `json:"use_headless" gorm:"default:false"`
	RateLimit    int            `json:"rate_limit" gorm:"default:1000"`
	HeadersJSON  string         `json:"headers_json" gorm:"type:jsonb"`
	CookiesJSON  string         `json:"cookies_json" gorm:"type:jsonb"`
	SelectorJSON string         `json:"selector_json" gorm:"type:jsonb"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`
}

// ScraperRun represents a scraping run
type ScraperRun struct {
	ID          uint       `json:"id" gorm:"primaryKey"`
	TargetID    uint       `json:"target_id" gorm:"not null"`
	Target      ScraperTarget `json:"target" gorm:"foreignKey:TargetID"`
	Status      string     `json:"status" gorm:"not null;default:'pending'"`
	StartedAt   *time.Time `json:"started_at"`
	FinishedAt  *time.Time `json:"finished_at"`
	StatsJSON   string     `json:"stats_json" gorm:"type:jsonb"`
	ErrorMsg    string     `json:"error_msg"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

// ScrapedRow represents scraped data
type ScrapedRow struct {
	ID              uint      `json:"id" gorm:"primaryKey"`
	TargetID        uint      `json:"target_id" gorm:"not null"`
	Target          ScraperTarget `json:"target" gorm:"foreignKey:TargetID"`
	HashKey         string    `json:"hash_key" gorm:"uniqueIndex;not null"`
	URL             string    `json:"url" gorm:"not null"`
	Type            string    `json:"type" gorm:"not null"`
	RawJSON         string    `json:"raw_json" gorm:"type:jsonb"`
	NormalizedJSON  string    `json:"normalized_json" gorm:"type:jsonb"`
	CreatedAt       time.Time `json:"created_at"`
}

// Permission represents a permission
type Permission struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	Name        string         `json:"name" gorm:"uniqueIndex;not null"`
	Description string         `json:"description"`
	Resource    string         `json:"resource" gorm:"not null"`
	Action      string         `json:"action" gorm:"not null"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}

// RolePermission represents role-permission mapping
type RolePermission struct {
	RoleID       uint       `json:"role_id" gorm:"primaryKey"`
	PermissionID uint       `json:"permission_id" gorm:"primaryKey"`
	Role         Role       `json:"role" gorm:"foreignKey:RoleID"`
	Permission   Permission `json:"permission" gorm:"foreignKey:PermissionID"`
	CreatedAt    time.Time  `json:"created_at"`
}

// Role represents a role
type Role struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	Name        string         `json:"name" gorm:"uniqueIndex;not null"`
	Description string         `json:"description"`
	IsSystem    bool           `json:"is_system" gorm:"default:false"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
	Permissions []Permission   `json:"permissions" gorm:"many2many:role_permissions;"`
}
