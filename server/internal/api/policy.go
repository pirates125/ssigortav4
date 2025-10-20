package api

import (
	"net/http"
	"strconv"
	"time"

	"eesigorta/backend/internal/repo"

	"github.com/gin-gonic/gin"
)

type PolicyHandler struct {
	repo *repo.Repository
}

func NewPolicyHandler(repo *repo.Repository) *PolicyHandler {
	return &PolicyHandler{repo: repo}
}

type PolicyResponse struct {
	ID           uint   `json:"id"`
	CustomerID   uint   `json:"customer_id"`
	Customer     struct {
		ID   uint   `json:"id"`
		Name string `json:"name"`
		TCVKN string `json:"tc_vkn"`
	} `json:"customer"`
	ProductID    uint   `json:"product_id"`
	Product      struct {
		ID   uint   `json:"id"`
		Name string `json:"name"`
		Type string `json:"type"`
	} `json:"product"`
	AgentID      uint   `json:"agent_id"`
	Agent        struct {
		ID    uint   `json:"id"`
		Email string `json:"email"`
		Role  string `json:"role"`
	} `json:"agent"`
	QuoteID      *uint  `json:"quote_id"`
	PolicyNumber string `json:"policy_number"`
	CompanyName  string `json:"company_name"`
	Premium      float64 `json:"premium"`
	Status       string `json:"status"`
	StartDate    string `json:"start_date"`
	EndDate      string `json:"end_date"`
	CreatedAt    string `json:"created_at"`
	UpdatedAt    string `json:"updated_at"`
}

type CreatePolicyRequest struct {
	CustomerID   uint    `json:"customer_id" binding:"required"`
	ProductID    uint    `json:"product_id" binding:"required"`
	AgentID      uint    `json:"agent_id" binding:"required"`
	QuoteID      *uint   `json:"quote_id"`
	CompanyName  string  `json:"company_name" binding:"required"`
	Premium      float64 `json:"premium" binding:"required"`
	StartDate    string  `json:"start_date" binding:"required"`
	EndDate      string  `json:"end_date" binding:"required"`
}

type UpdatePolicyRequest struct {
	CustomerID   *uint    `json:"customer_id"`
	ProductID    *uint    `json:"product_id"`
	AgentID      *uint    `json:"agent_id"`
	QuoteID      *uint    `json:"quote_id"`
	CompanyName  string   `json:"company_name"`
	Premium      *float64 `json:"premium"`
	Status       string   `json:"status"`
	StartDate    string   `json:"start_date"`
	EndDate      string   `json:"end_date"`
}

func (h *PolicyHandler) GetPolicies(c *gin.Context) {
	query := c.Query("query")
	customerID := c.Query("customer_id")
	agentID := c.Query("agent_id")
	status := c.Query("status")
	page := c.GetInt("page")
	pageSize := c.GetInt("page_size")

	// Set defaults
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}

	var policies []repo.Policy
	var total int64

	db := h.repo.DB().Model(&repo.Policy{})

	// Apply search filter
	if query != "" {
		db = db.Where("policy_number ILIKE ? OR company_name ILIKE ?",
			"%"+query+"%", "%"+query+"%")
	}

	// Apply filters
	if customerID != "" {
		if id, err := strconv.ParseUint(customerID, 10, 32); err == nil {
			db = db.Where("customer_id = ?", uint(id))
		}
	}
	if agentID != "" {
		if id, err := strconv.ParseUint(agentID, 10, 32); err == nil {
			db = db.Where("agent_id = ?", uint(id))
		}
	}
	if status != "" {
		db = db.Where("status = ?", status)
	}

	// Get total count
	db.Count(&total)

	// Apply pagination
	offset := (page - 1) * pageSize
	err := db.Preload("Customer").Preload("Product").Preload("Agent").Preload("Quote").
		Offset(offset).Limit(pageSize).Order("created_at DESC").Find(&policies).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Database error"})
		return
	}

	// Convert to response
	var response []PolicyResponse
	for _, policy := range policies {
		response = append(response, h.policyToResponse(&policy))
	}

	var totalPages int
	if pageSize > 0 {
		totalPages = int((total + int64(pageSize) - 1) / int64(pageSize))
	} else {
		totalPages = 0
	}

	c.JSON(http.StatusOK, PaginationResponse{
		Data:       response,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	})
}

func (h *PolicyHandler) GetPolicy(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid policy ID"})
		return
	}

	var policy repo.Policy
	err = h.repo.DB().Preload("Customer").Preload("Product").Preload("Agent").Preload("Quote").
		First(&policy, uint(id)).Error
	if err != nil {
		c.JSON(http.StatusNotFound, ErrorResponse{Error: "Policy not found"})
		return
	}

	c.JSON(http.StatusOK, h.policyToResponse(&policy))
}

func (h *PolicyHandler) CreatePolicy(c *gin.Context) {
	var req CreatePolicyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	// Validate dates
	startDate, err := time.Parse("2006-01-02", req.StartDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid start date format"})
		return
	}
	endDate, err := time.Parse("2006-01-02", req.EndDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid end date format"})
		return
	}
	if endDate.Before(startDate) {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "End date must be after start date"})
		return
	}

	// Check if customer exists
	var customer repo.Customer
	err = h.repo.DB().First(&customer, req.CustomerID).Error
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Customer not found"})
		return
	}

	// Check if product exists
	var product repo.Product
	err = h.repo.DB().First(&product, req.ProductID).Error
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Product not found"})
		return
	}

	// Check if agent exists
	var agent repo.User
	err = h.repo.DB().First(&agent, req.AgentID).Error
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Agent not found"})
		return
	}

	// Generate policy number
	policyNumber := h.generatePolicyNumber()

	policy := &repo.Policy{
		CustomerID:   req.CustomerID,
		ProductID:    req.ProductID,
		AgentID:      req.AgentID,
		QuoteID:      req.QuoteID,
		PolicyNumber: policyNumber,
		CompanyName:  req.CompanyName,
		Premium:      req.Premium,
		Status:       "active",
		StartDate:    req.StartDate,
		EndDate:      req.EndDate,
	}

	err = h.repo.DB().Create(policy).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to create policy"})
		return
	}

	// Reload with relations
	h.repo.DB().Preload("Customer").Preload("Product").Preload("Agent").Preload("Quote").
		First(policy, policy.ID)

	c.JSON(http.StatusCreated, h.policyToResponse(policy))
}

func (h *PolicyHandler) UpdatePolicy(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid policy ID"})
		return
	}

	var req UpdatePolicyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	var policy repo.Policy
	err = h.repo.DB().First(&policy, uint(id)).Error
	if err != nil {
		c.JSON(http.StatusNotFound, ErrorResponse{Error: "Policy not found"})
		return
	}

	// Update fields
	if req.CustomerID != nil {
		// Check if customer exists
		var customer repo.Customer
		err = h.repo.DB().First(&customer, *req.CustomerID).Error
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Customer not found"})
			return
		}
		policy.CustomerID = *req.CustomerID
	}
	if req.ProductID != nil {
		// Check if product exists
		var product repo.Product
		err = h.repo.DB().First(&product, *req.ProductID).Error
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Product not found"})
			return
		}
		policy.ProductID = *req.ProductID
	}
	if req.AgentID != nil {
		// Check if agent exists
		var agent repo.User
		err = h.repo.DB().First(&agent, *req.AgentID).Error
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Agent not found"})
			return
		}
		policy.AgentID = *req.AgentID
	}
	if req.QuoteID != nil {
		policy.QuoteID = req.QuoteID
	}
	if req.CompanyName != "" {
		policy.CompanyName = req.CompanyName
	}
	if req.Premium != nil {
		policy.Premium = *req.Premium
	}
	if req.Status != "" {
		policy.Status = req.Status
	}
	if req.StartDate != "" {
		policy.StartDate = req.StartDate
	}
	if req.EndDate != "" {
		policy.EndDate = req.EndDate
	}

	err = h.repo.DB().Save(&policy).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to update policy"})
		return
	}

	// Reload with relations
	h.repo.DB().Preload("Customer").Preload("Product").Preload("Agent").Preload("Quote").
		First(&policy, policy.ID)

	c.JSON(http.StatusOK, h.policyToResponse(&policy))
}

func (h *PolicyHandler) DeletePolicy(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid policy ID"})
		return
	}

	err = h.repo.DB().Delete(&repo.Policy{}, uint(id)).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to delete policy"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Policy deleted successfully"})
}

func (h *PolicyHandler) generatePolicyNumber() string {
	// Generate a unique policy number
	// Format: POL-YYYY-NNNNNN
	year := time.Now().Year()
	
	var count int64
	h.repo.DB().Model(&repo.Policy{}).Where("policy_number LIKE ?", "POL-"+strconv.Itoa(year)+"-%").Count(&count)
	
	number := count + 1
	return "POL-" + strconv.Itoa(year) + "-" + strconv.FormatInt(number, 10)
}

func (h *PolicyHandler) policyToResponse(policy *repo.Policy) PolicyResponse {
	response := PolicyResponse{
		ID:           policy.ID,
		CustomerID:    policy.CustomerID,
		ProductID:     policy.ProductID,
		AgentID:       policy.AgentID,
		QuoteID:       policy.QuoteID,
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
