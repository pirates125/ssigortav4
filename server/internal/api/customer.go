package api

import (
	"net/http"
	"strconv"

	"eesigorta/backend/internal/repo"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type CustomerHandler struct {
	repo *repo.Repository
}

func NewCustomerHandler(repo *repo.Repository) *CustomerHandler {
	return &CustomerHandler{repo: repo}
}

type CustomerRequest struct {
	TCVKN      string `json:"tc_vkn" binding:"required"`
	Name       string `json:"name" binding:"required"`
	Email      string `json:"email" binding:"omitempty,email"`
	Phone      string `json:"phone"`
	Address    string `json:"address"`
	City       string `json:"city"`
	District   string `json:"district"`
	PostalCode string `json:"postal_code"`
	BirthDate  string `json:"birth_date"`
	Gender     string `json:"gender"`
}

type CustomerResponse struct {
	ID         uint   `json:"id"`
	TCVKN      string `json:"tc_vkn"`
	Name       string `json:"name"`
	Email      string `json:"email"`
	Phone      string `json:"phone"`
	Address    string `json:"address"`
	City       string `json:"city"`
	District   string `json:"district"`
	PostalCode string `json:"postal_code"`
	BirthDate  string `json:"birth_date"`
	Gender     string `json:"gender"`
	CreatedAt  string `json:"created_at"`
	UpdatedAt  string `json:"updated_at"`
}

// GetCustomers godoc
// @Summary Get customers
// @Description Get paginated list of customers with optional search
// @Tags customers
// @Produce json
// @Param query query string false "Search query"
// @Param page query int false "Page number" default(1)
// @Param pageSize query int false "Page size" default(20)
// @Success 200 {object} PaginationResponse
// @Failure 400 {object} ErrorResponse
// @Router /customers [get]
func (h *CustomerHandler) GetCustomers(c *gin.Context) {
	query := c.Query("query")
	page := c.GetInt("page")
	pageSize := c.GetInt("page_size")

	// Set defaults
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}

	var customers []repo.Customer
	var total int64

	db := h.repo.DB().Model(&repo.Customer{})

	// Apply search filter
	if query != "" {
		db = db.Where("name ILIKE ? OR email ILIKE ? OR tc_vkn ILIKE ?", 
			"%"+query+"%", "%"+query+"%", "%"+query+"%")
	}

	// Get total count
	db.Count(&total)

	// Apply pagination
	offset := (page - 1) * pageSize
	err := db.Offset(offset).Limit(pageSize).Find(&customers).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Database error"})
		return
	}

	// Convert to response
	var response []CustomerResponse
	for _, customer := range customers {
		response = append(response, h.customerToResponse(&customer))
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

// GetCustomer godoc
// @Summary Get customer by ID
// @Description Get customer details by ID
// @Tags customers
// @Produce json
// @Param id path int true "Customer ID"
// @Success 200 {object} CustomerResponse
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Router /customers/{id} [get]
func (h *CustomerHandler) GetCustomer(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid customer ID"})
		return
	}

	var customer repo.Customer
	err = h.repo.DB().First(&customer, uint(id)).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Customer not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Database error"})
		return
	}

	c.JSON(http.StatusOK, h.customerToResponse(&customer))
}

// CreateCustomer godoc
// @Summary Create customer
// @Description Create a new customer
// @Tags customers
// @Accept json
// @Produce json
// @Param request body CustomerRequest true "Customer data"
// @Success 201 {object} CustomerResponse
// @Failure 400 {object} ErrorResponse
// @Failure 409 {object} ErrorResponse
// @Router /customers [post]
func (h *CustomerHandler) CreateCustomer(c *gin.Context) {
	var req CustomerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	// Check if customer already exists
	var existingCustomer repo.Customer
	err := h.repo.DB().Where("tc_vkn = ?", req.TCVKN).First(&existingCustomer).Error
	if err == nil {
		c.JSON(http.StatusConflict, ErrorResponse{Error: "Customer with this TC/VKN already exists"})
		return
	}

	// Create customer
	customer := repo.Customer{
		TCVKN:      req.TCVKN,
		Name:       req.Name,
		Email:      req.Email,
		Phone:      req.Phone,
		Address:    req.Address,
		City:       req.City,
		District:   req.District,
		PostalCode: req.PostalCode,
		Gender:     req.Gender,
	}

	err = h.repo.DB().Create(&customer).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to create customer"})
		return
	}

	// Log audit
	userID, _ := c.Get("user_id")
	h.logAudit(c, userID.(uint), "customer_created", "customer", &customer.ID, map[string]interface{}{
		"tc_vkn": customer.TCVKN,
		"name":   customer.Name,
	})

	c.JSON(http.StatusCreated, h.customerToResponse(&customer))
}

// UpdateCustomer godoc
// @Summary Update customer
// @Description Update customer details
// @Tags customers
// @Accept json
// @Produce json
// @Param id path int true "Customer ID"
// @Param request body CustomerRequest true "Customer data"
// @Success 200 {object} CustomerResponse
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 409 {object} ErrorResponse
// @Router /customers/{id} [put]
func (h *CustomerHandler) UpdateCustomer(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid customer ID"})
		return
	}

	var req CustomerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	// Find existing customer
	var customer repo.Customer
	err = h.repo.DB().First(&customer, uint(id)).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Customer not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Database error"})
		return
	}

	// Check if TC/VKN is being changed and if it conflicts
	if customer.TCVKN != req.TCVKN {
		var existingCustomer repo.Customer
		err = h.repo.DB().Where("tc_vkn = ? AND id != ?", req.TCVKN, uint(id)).First(&existingCustomer).Error
		if err == nil {
			c.JSON(http.StatusConflict, ErrorResponse{Error: "Customer with this TC/VKN already exists"})
			return
		}
	}

	// Update customer
	customer.TCVKN = req.TCVKN
	customer.Name = req.Name
	customer.Email = req.Email
	customer.Phone = req.Phone
	customer.Address = req.Address
	customer.City = req.City
	customer.District = req.District
	customer.PostalCode = req.PostalCode
	customer.Gender = req.Gender

	err = h.repo.DB().Save(&customer).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to update customer"})
		return
	}

	// Log audit
	userID, _ := c.Get("user_id")
	h.logAudit(c, userID.(uint), "customer_updated", "customer", &customer.ID, map[string]interface{}{
		"tc_vkn": customer.TCVKN,
		"name":   customer.Name,
	})

	c.JSON(http.StatusOK, h.customerToResponse(&customer))
}

// DeleteCustomer godoc
// @Summary Delete customer
// @Description Soft delete a customer
// @Tags customers
// @Param id path int true "Customer ID"
// @Success 200 {object} SuccessResponse
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Router /customers/{id} [delete]
func (h *CustomerHandler) DeleteCustomer(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid customer ID"})
		return
	}

	var customer repo.Customer
	err = h.repo.DB().First(&customer, uint(id)).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Customer not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Database error"})
		return
	}

	err = h.repo.DB().Delete(&customer).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to delete customer"})
		return
	}

	// Log audit
	userID, _ := c.Get("user_id")
	h.logAudit(c, userID.(uint), "customer_deleted", "customer", &customer.ID, map[string]interface{}{
		"tc_vkn": customer.TCVKN,
		"name":   customer.Name,
	})

	c.JSON(http.StatusOK, SuccessResponse{Message: "Customer deleted successfully"})
}

func (h *CustomerHandler) customerToResponse(customer *repo.Customer) CustomerResponse {
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
		BirthDate:  "", // Format date if needed
		Gender:     customer.Gender,
		CreatedAt:  customer.CreatedAt.Format("2006-01-02T15:04:05Z"),
		UpdatedAt:  customer.UpdatedAt.Format("2006-01-02T15:04:05Z"),
	}
}

func (h *CustomerHandler) logAudit(c *gin.Context, userID uint, action, entity string, entityID *uint, meta map[string]interface{}) {
	auditLog := repo.AuditLog{
		UserID:    &userID,
		Action:    action,
		Entity:    entity,
		EntityID:  entityID,
		IP:        c.ClientIP(),
		UserAgent: c.GetHeader("User-Agent"),
		MetaJSON:  `{"meta": "data"}`,
	}

	h.repo.DB().Create(&auditLog)
}
