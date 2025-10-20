package api

import (
	"net/http"
	"strconv"

	"eesigorta/backend/internal/repo"

	"github.com/gin-gonic/gin"
)

type BranchHandler struct {
	repo *repo.Repository
}

func NewBranchHandler(repo *repo.Repository) *BranchHandler {
	return &BranchHandler{repo: repo}
}

type BranchResponse struct {
	ID        uint   `json:"id"`
	Name      string `json:"name"`
	City      string `json:"city"`
	Address   string `json:"address"`
	Phone     string `json:"phone"`
	Email     string `json:"email"`
	ManagerID *uint  `json:"manager_id"`
	Manager   *struct {
		ID    uint   `json:"id"`
		Email string `json:"email"`
		Role  string `json:"role"`
	} `json:"manager,omitempty"`
	IsActive  bool   `json:"is_active"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}

type CreateBranchRequest struct {
	Name      string `json:"name" binding:"required"`
	City      string `json:"city"`
	Address   string `json:"address"`
	Phone     string `json:"phone"`
	Email     string `json:"email"`
	ManagerID *uint  `json:"manager_id"`
}

type UpdateBranchRequest struct {
	Name      string `json:"name"`
	City      string `json:"city"`
	Address   string `json:"address"`
	Phone     string `json:"phone"`
	Email     string `json:"email"`
	ManagerID *uint  `json:"manager_id"`
	IsActive  *bool  `json:"is_active"`
}

func (h *BranchHandler) GetBranches(c *gin.Context) {
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

	var branches []repo.Branch
	var total int64

	db := h.repo.DB().Model(&repo.Branch{})

	// Apply search filter
	if query != "" {
		db = db.Where("name ILIKE ? OR city ILIKE ? OR address ILIKE ?",
			"%"+query+"%", "%"+query+"%", "%"+query+"%")
	}

	// Get total count
	db.Count(&total)

	// Apply pagination
	offset := (page - 1) * pageSize
	err := db.Preload("Manager").Offset(offset).Limit(pageSize).Order("created_at DESC").Find(&branches).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Database error"})
		return
	}

	// Convert to response
	var response []BranchResponse
	for _, branch := range branches {
		response = append(response, h.branchToResponse(&branch))
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

func (h *BranchHandler) GetBranch(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid branch ID"})
		return
	}

	var branch repo.Branch
	err = h.repo.DB().Preload("Manager").First(&branch, uint(id)).Error
	if err != nil {
		c.JSON(http.StatusNotFound, ErrorResponse{Error: "Branch not found"})
		return
	}

	c.JSON(http.StatusOK, h.branchToResponse(&branch))
}

func (h *BranchHandler) CreateBranch(c *gin.Context) {
	var req CreateBranchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	branch := &repo.Branch{
		Name:      req.Name,
		City:      req.City,
		Address:   req.Address,
		Phone:     req.Phone,
		Email:     req.Email,
		ManagerID: req.ManagerID,
		IsActive:  true,
	}

	err := h.repo.DB().Create(branch).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to create branch"})
		return
	}

	// Reload with manager
	h.repo.DB().Preload("Manager").First(branch, branch.ID)

	c.JSON(http.StatusCreated, h.branchToResponse(branch))
}

func (h *BranchHandler) UpdateBranch(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid branch ID"})
		return
	}

	var req UpdateBranchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	var branch repo.Branch
	err = h.repo.DB().First(&branch, uint(id)).Error
	if err != nil {
		c.JSON(http.StatusNotFound, ErrorResponse{Error: "Branch not found"})
		return
	}

	// Update fields
	if req.Name != "" {
		branch.Name = req.Name
	}
	if req.City != "" {
		branch.City = req.City
	}
	if req.Address != "" {
		branch.Address = req.Address
	}
	if req.Phone != "" {
		branch.Phone = req.Phone
	}
	if req.Email != "" {
		branch.Email = req.Email
	}
	if req.ManagerID != nil {
		branch.ManagerID = req.ManagerID
	}
	if req.IsActive != nil {
		branch.IsActive = *req.IsActive
	}

	err = h.repo.DB().Save(&branch).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to update branch"})
		return
	}

	// Reload with manager
	h.repo.DB().Preload("Manager").First(&branch, branch.ID)

	c.JSON(http.StatusOK, h.branchToResponse(&branch))
}

func (h *BranchHandler) DeleteBranch(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid branch ID"})
		return
	}

	err = h.repo.DB().Delete(&repo.Branch{}, uint(id)).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to delete branch"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Branch deleted successfully"})
}

func (h *BranchHandler) branchToResponse(branch *repo.Branch) BranchResponse {
	response := BranchResponse{
		ID:        branch.ID,
		Name:      branch.Name,
		City:      branch.City,
		Address:   branch.Address,
		Phone:     branch.Phone,
		Email:     branch.Email,
		ManagerID: branch.ManagerID,
		IsActive:  branch.IsActive,
		CreatedAt: branch.CreatedAt.Format("2006-01-02 15:04:05"),
		UpdatedAt: branch.UpdatedAt.Format("2006-01-02 15:04:05"),
	}

	if branch.Manager != nil {
		response.Manager = &struct {
			ID    uint   `json:"id"`
			Email string `json:"email"`
			Role  string `json:"role"`
		}{
			ID:    branch.Manager.ID,
			Email: branch.Manager.Email,
			Role:  branch.Manager.Role,
		}
	}

	return response
}
