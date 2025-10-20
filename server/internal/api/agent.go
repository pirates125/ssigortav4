package api

import (
	"net/http"
	"strconv"

	"eesigorta/backend/internal/repo"

	"github.com/gin-gonic/gin"
)

type AgentHandler struct {
	repo *repo.Repository
}

func NewAgentHandler(repo *repo.Repository) *AgentHandler {
	return &AgentHandler{repo: repo}
}

type AgentResponse struct {
	ID        uint   `json:"id"`
	BranchID  uint   `json:"branch_id"`
	Branch    struct {
		ID   uint   `json:"id"`
		Name string `json:"name"`
		City string `json:"city"`
	} `json:"branch"`
	Name      string `json:"name"`
	Phone     string `json:"phone"`
	Email     string `json:"email"`
	LicenseNo string `json:"license_no"`
	IsActive  bool   `json:"is_active"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}

type CreateAgentRequest struct {
	BranchID  uint   `json:"branch_id" binding:"required"`
	Name      string `json:"name" binding:"required"`
	Phone     string `json:"phone"`
	Email     string `json:"email"`
	LicenseNo string `json:"license_no"`
}

type UpdateAgentRequest struct {
	BranchID  *uint  `json:"branch_id"`
	Name      string `json:"name"`
	Phone     string `json:"phone"`
	Email     string `json:"email"`
	LicenseNo string `json:"license_no"`
	IsActive  *bool  `json:"is_active"`
}

func (h *AgentHandler) GetAgents(c *gin.Context) {
	query := c.Query("query")
	branchID := c.Query("branch_id")
	page := c.GetInt("page")
	pageSize := c.GetInt("page_size")

	// Set defaults
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}

	var agents []repo.Agent
	var total int64

	db := h.repo.DB().Model(&repo.Agent{})

	// Apply search filter
	if query != "" {
		db = db.Where("name ILIKE ? OR email ILIKE ? OR license_no ILIKE ?",
			"%"+query+"%", "%"+query+"%", "%"+query+"%")
	}

	// Apply branch filter
	if branchID != "" {
		if id, err := strconv.ParseUint(branchID, 10, 32); err == nil {
			db = db.Where("branch_id = ?", uint(id))
		}
	}

	// Get total count
	db.Count(&total)

	// Apply pagination
	offset := (page - 1) * pageSize
	err := db.Preload("Branch").Offset(offset).Limit(pageSize).Order("created_at DESC").Find(&agents).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Database error"})
		return
	}

	// Convert to response
	var response []AgentResponse
	for _, agent := range agents {
		response = append(response, h.agentToResponse(&agent))
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

func (h *AgentHandler) GetAgent(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid agent ID"})
		return
	}

	var agent repo.Agent
	err = h.repo.DB().Preload("Branch").First(&agent, uint(id)).Error
	if err != nil {
		c.JSON(http.StatusNotFound, ErrorResponse{Error: "Agent not found"})
		return
	}

	c.JSON(http.StatusOK, h.agentToResponse(&agent))
}

func (h *AgentHandler) CreateAgent(c *gin.Context) {
	var req CreateAgentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	// Check if branch exists
	var branch repo.Branch
	err := h.repo.DB().First(&branch, req.BranchID).Error
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Branch not found"})
		return
	}

	agent := &repo.Agent{
		BranchID:  req.BranchID,
		Name:      req.Name,
		Phone:     req.Phone,
		Email:     req.Email,
		LicenseNo: req.LicenseNo,
		IsActive:  true,
	}

	err = h.repo.DB().Create(agent).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to create agent"})
		return
	}

	// Reload with branch
	h.repo.DB().Preload("Branch").First(agent, agent.ID)

	c.JSON(http.StatusCreated, h.agentToResponse(agent))
}

func (h *AgentHandler) UpdateAgent(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid agent ID"})
		return
	}

	var req UpdateAgentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	var agent repo.Agent
	err = h.repo.DB().First(&agent, uint(id)).Error
	if err != nil {
		c.JSON(http.StatusNotFound, ErrorResponse{Error: "Agent not found"})
		return
	}

	// Update fields
	if req.BranchID != nil {
		// Check if branch exists
		var branch repo.Branch
		err = h.repo.DB().First(&branch, *req.BranchID).Error
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Branch not found"})
			return
		}
		agent.BranchID = *req.BranchID
	}
	if req.Name != "" {
		agent.Name = req.Name
	}
	if req.Phone != "" {
		agent.Phone = req.Phone
	}
	if req.Email != "" {
		agent.Email = req.Email
	}
	if req.LicenseNo != "" {
		agent.LicenseNo = req.LicenseNo
	}
	if req.IsActive != nil {
		agent.IsActive = *req.IsActive
	}

	err = h.repo.DB().Save(&agent).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to update agent"})
		return
	}

	// Reload with branch
	h.repo.DB().Preload("Branch").First(&agent, agent.ID)

	c.JSON(http.StatusOK, h.agentToResponse(&agent))
}

func (h *AgentHandler) DeleteAgent(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid agent ID"})
		return
	}

	err = h.repo.DB().Delete(&repo.Agent{}, uint(id)).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to delete agent"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Agent deleted successfully"})
}

func (h *AgentHandler) agentToResponse(agent *repo.Agent) AgentResponse {
	return AgentResponse{
		ID:   agent.ID,
		BranchID: agent.BranchID,
		Branch: struct {
			ID   uint   `json:"id"`
			Name string `json:"name"`
			City string `json:"city"`
		}{
			ID:   agent.Branch.ID,
			Name: agent.Branch.Name,
			City: agent.Branch.City,
		},
		Name:      agent.Name,
		Phone:     agent.Phone,
		Email:     agent.Email,
		LicenseNo: agent.LicenseNo,
		IsActive:  agent.IsActive,
		CreatedAt: agent.CreatedAt.Format("2006-01-02 15:04:05"),
		UpdatedAt: agent.UpdatedAt.Format("2006-01-02 15:04:05"),
	}
}
