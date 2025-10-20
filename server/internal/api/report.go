package api

import (
	"net/http"
	"time"

	"eesigorta/backend/internal/repo"

	"github.com/gin-gonic/gin"
)

type ReportHandler struct {
	repo *repo.Repository
}

func NewReportHandler(repo *repo.Repository) *ReportHandler {
	return &ReportHandler{repo: repo}
}

type DashboardStats struct {
	TotalCustomers    int64   `json:"total_customers"`
	TotalPolicies     int64   `json:"total_policies"`
	TotalQuotes       int64   `json:"total_quotes"`
	TotalPremium      float64 `json:"total_premium"`
	ActivePolicies    int64   `json:"active_policies"`
	ExpiredPolicies   int64   `json:"expired_policies"`
	CancelledPolicies int64   `json:"cancelled_policies"`
	MonthlyPremium    float64 `json:"monthly_premium"`
	YearlyPremium     float64 `json:"yearly_premium"`
}

type PolicyStats struct {
	Status string  `json:"status"`
	Count  int64   `json:"count"`
	Amount float64 `json:"amount"`
}

type MonthlyStats struct {
	Month string  `json:"month"`
	Count int64   `json:"count"`
	Amount float64 `json:"amount"`
}

type ReportRequest struct {
	StartDate string `json:"start_date" form:"start_date"`
	EndDate   string `json:"end_date" form:"end_date"`
	BranchID  *uint  `json:"branch_id" form:"branch_id"`
	AgentID   *uint  `json:"agent_id" form:"agent_id"`
	Format    string `json:"format" form:"format"` // csv, excel, json
}

func (h *ReportHandler) GetDashboardStats(c *gin.Context) {
	var stats DashboardStats

	// Total customers
	h.repo.DB().Model(&repo.Customer{}).Count(&stats.TotalCustomers)

	// Total policies
	h.repo.DB().Model(&repo.Policy{}).Count(&stats.TotalPolicies)

	// Total quotes
	h.repo.DB().Model(&repo.Quote{}).Count(&stats.TotalQuotes)

	// Total premium
	h.repo.DB().Model(&repo.Policy{}).Select("COALESCE(SUM(premium), 0)").Scan(&stats.TotalPremium)

	// Active policies
	h.repo.DB().Model(&repo.Policy{}).Where("status = ?", "active").Count(&stats.ActivePolicies)

	// Expired policies
	h.repo.DB().Model(&repo.Policy{}).Where("status = ?", "expired").Count(&stats.ExpiredPolicies)

	// Cancelled policies
	h.repo.DB().Model(&repo.Policy{}).Where("status = ?", "cancelled").Count(&stats.CancelledPolicies)

	// Monthly premium (current month)
	now := time.Now()
	startOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	h.repo.DB().Model(&repo.Policy{}).
		Where("created_at >= ? AND status = ?", startOfMonth, "active").
		Select("COALESCE(SUM(premium), 0)").Scan(&stats.MonthlyPremium)

	// Yearly premium (current year)
	startOfYear := time.Date(now.Year(), 1, 1, 0, 0, 0, 0, now.Location())
	h.repo.DB().Model(&repo.Policy{}).
		Where("created_at >= ? AND status = ?", startOfYear, "active").
		Select("COALESCE(SUM(premium), 0)").Scan(&stats.YearlyPremium)

	c.JSON(http.StatusOK, stats)
}

func (h *ReportHandler) GetPolicyStats(c *gin.Context) {
	var stats []PolicyStats

	// Get policy counts by status
	h.repo.DB().Model(&repo.Policy{}).
		Select("status, COUNT(*) as count, COALESCE(SUM(premium), 0) as amount").
		Group("status").
		Scan(&stats)

	c.JSON(http.StatusOK, stats)
}

func (h *ReportHandler) GetMonthlyStats(c *gin.Context) {
	var stats []MonthlyStats

	// Get monthly policy counts for the last 12 months
	h.repo.DB().Model(&repo.Policy{}).
		Select("TO_CHAR(created_at, 'YYYY-MM') as month, COUNT(*) as count, COALESCE(SUM(premium), 0) as amount").
		Where("created_at >= ?", time.Now().AddDate(0, -12, 0)).
		Group("TO_CHAR(created_at, 'YYYY-MM')").
		Order("month").
		Scan(&stats)

	c.JSON(http.StatusOK, stats)
}

func (h *ReportHandler) GetBranchStats(c *gin.Context) {
	var stats []struct {
		BranchID   uint    `json:"branch_id"`
		BranchName string  `json:"branch_name"`
		PolicyCount int64  `json:"policy_count"`
		TotalPremium float64 `json:"total_premium"`
	}

	h.repo.DB().Table("policies").
		Select("branches.id as branch_id, branches.name as branch_name, COUNT(policies.id) as policy_count, COALESCE(SUM(policies.premium), 0) as total_premium").
		Joins("JOIN agents ON policies.agent_id = agents.id").
		Joins("JOIN branches ON agents.branch_id = branches.id").
		Group("branches.id, branches.name").
		Scan(&stats)

	c.JSON(http.StatusOK, stats)
}

func (h *ReportHandler) GetAgentStats(c *gin.Context) {
	var stats []struct {
		AgentID     uint    `json:"agent_id"`
		AgentName   string  `json:"agent_name"`
		BranchName  string  `json:"branch_name"`
		PolicyCount int64   `json:"policy_count"`
		TotalPremium float64 `json:"total_premium"`
	}

	h.repo.DB().Table("policies").
		Select("agents.id as agent_id, agents.name as agent_name, branches.name as branch_name, COUNT(policies.id) as policy_count, COALESCE(SUM(policies.premium), 0) as total_premium").
		Joins("JOIN agents ON policies.agent_id = agents.id").
		Joins("JOIN branches ON agents.branch_id = branches.id").
		Group("agents.id, agents.name, branches.name").
		Scan(&stats)

	c.JSON(http.StatusOK, stats)
}

func (h *ReportHandler) ExportPolicies(c *gin.Context) {
	var req ReportRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	// Build query
	db := h.repo.DB().Model(&repo.Policy{}).
		Preload("Customer").Preload("Product").Preload("Agent")

	// Apply date filters
	if req.StartDate != "" {
		if startDate, err := time.Parse("2006-01-02", req.StartDate); err == nil {
			db = db.Where("created_at >= ?", startDate)
		}
	}
	if req.EndDate != "" {
		if endDate, err := time.Parse("2006-01-02", req.EndDate); err == nil {
			db = db.Where("created_at <= ?", endDate)
		}
	}

	// Apply branch filter
	if req.BranchID != nil {
		db = db.Joins("JOIN agents ON policies.agent_id = agents.id").
			Where("agents.branch_id = ?", *req.BranchID)
	}

	// Apply agent filter
	if req.AgentID != nil {
		db = db.Where("agent_id = ?", *req.AgentID)
	}

	var policies []repo.Policy
	err := db.Find(&policies).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Database error"})
		return
	}

	// Convert to response format
	var response []PolicyResponse
	for _, policy := range policies {
		response = append(response, h.policyToResponse(&policy))
	}

	// Set appropriate content type based on format
	switch req.Format {
	case "csv":
		c.Header("Content-Type", "text/csv")
		c.Header("Content-Disposition", "attachment; filename=policies.csv")
		// TODO: Implement CSV export
		c.JSON(http.StatusOK, response)
	case "excel":
		c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
		c.Header("Content-Disposition", "attachment; filename=policies.xlsx")
		// TODO: Implement Excel export
		c.JSON(http.StatusOK, response)
	default:
		c.JSON(http.StatusOK, response)
	}
}

func (h *ReportHandler) ExportCustomers(c *gin.Context) {
	var req ReportRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	// Build query
	db := h.repo.DB().Model(&repo.Customer{})

	// Apply date filters
	if req.StartDate != "" {
		if startDate, err := time.Parse("2006-01-02", req.StartDate); err == nil {
			db = db.Where("created_at >= ?", startDate)
		}
	}
	if req.EndDate != "" {
		if endDate, err := time.Parse("2006-01-02", req.EndDate); err == nil {
			db = db.Where("created_at <= ?", endDate)
		}
	}

	var customers []repo.Customer
	err := db.Find(&customers).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Database error"})
		return
	}

	// Convert to response format
	var response []CustomerResponse
	for _, customer := range customers {
		response = append(response, h.customerToResponse(&customer))
	}

	// Set appropriate content type based on format
	switch req.Format {
	case "csv":
		c.Header("Content-Type", "text/csv")
		c.Header("Content-Disposition", "attachment; filename=customers.csv")
		// TODO: Implement CSV export
		c.JSON(http.StatusOK, response)
	case "excel":
		c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
		c.Header("Content-Disposition", "attachment; filename=customers.xlsx")
		// TODO: Implement Excel export
		c.JSON(http.StatusOK, response)
	default:
		c.JSON(http.StatusOK, response)
	}
}

// Helper methods (these should be moved to a shared location)
func (h *ReportHandler) policyToResponse(policy *repo.Policy) PolicyResponse {
	response := PolicyResponse{
		ID:           policy.ID,
		CustomerID:   policy.CustomerID,
		ProductID:    policy.ProductID,
		AgentID:      policy.AgentID,
		QuoteID:      policy.QuoteID,
		PolicyNumber: policy.PolicyNumber,
		CompanyName:  policy.CompanyName,
		Premium:      policy.Premium,
		Status:       policy.Status,
		StartDate:    policy.StartDate,
		EndDate:      policy.EndDate,
		CreatedAt:    policy.CreatedAt.Format("2006-01-02 15:04:05"),
		UpdatedAt:    policy.UpdatedAt.Format("2006-01-02 15:04:05"),
	}

	// Set customer info
	if policy.Customer.ID != 0 {
		response.Customer = struct {
			ID    uint   `json:"id"`
			Name  string `json:"name"`
			TCVKN string `json:"tc_vkn"`
		}{
			ID:    policy.Customer.ID,
			Name:  policy.Customer.Name,
			TCVKN: policy.Customer.TCVKN,
		}
	}

	// Set product info
	if policy.Product.ID != 0 {
		response.Product = struct {
			ID   uint   `json:"id"`
			Name string `json:"name"`
			Type string `json:"type"`
		}{
			ID:   policy.Product.ID,
			Name: policy.Product.Name,
			Type: policy.Product.Type,
		}
	}

	// Set agent info
	if policy.Agent.ID != 0 {
		response.Agent = struct {
			ID    uint   `json:"id"`
			Email string `json:"email"`
			Role  string `json:"role"`
		}{
			ID:    policy.Agent.ID,
			Email: policy.Agent.Email,
			Role:  policy.Agent.Role,
		}
	}

	return response
}

func (h *ReportHandler) customerToResponse(customer *repo.Customer) CustomerResponse {
	return CustomerResponse{
		ID:         customer.ID,
		TCVKN:      customer.TCVKN,
		Name:       customer.Name,
		Email:      customer.Email,
		Phone:      customer.Phone,
		Address:    customer.Address,
		City:       customer.City,
		District:   customer.District,
		PostalCode: customer.PostalCode,
		BirthDate:  customer.BirthDate.Format("2006-01-02"),
		Gender:     customer.Gender,
		CreatedAt:  customer.CreatedAt.Format("2006-01-02 15:04:05"),
		UpdatedAt:  customer.UpdatedAt.Format("2006-01-02 15:04:05"),
	}
}
