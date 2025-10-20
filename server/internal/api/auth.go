package api

import (
	"net/http"
	"time"

	"eesigorta/backend/internal/auth"
	"eesigorta/backend/internal/repo"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type AuthHandler struct {
	repo      *repo.Repository
	jwtMgr    *auth.JWTManager
	totpMgr   *auth.TOTPManager
}

func NewAuthHandler(repo *repo.Repository, jwtMgr *auth.JWTManager, totpMgr *auth.TOTPManager) *AuthHandler {
	return &AuthHandler{
		repo:    repo,
		jwtMgr:  jwtMgr,
		totpMgr: totpMgr,
	}
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

type LoginResponse struct {
	TokenPair *auth.TokenPair `json:"token_pair"`
	User      *UserResponse   `json:"user"`
	Requires2FA bool          `json:"requires_2fa"`
}

type UserResponse struct {
	ID           uint   `json:"id"`
	Email        string `json:"email"`
	Role         string `json:"role"`
	TwoFAEnabled bool   `json:"two_fa_enabled"`
	IsActive     bool   `json:"is_active"`
	CreatedAt    time.Time `json:"created_at"`
}

type TwoFARequest struct {
	Code string `json:"code" binding:"required,len=6"`
}

type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

type Enable2FARequest struct {
	Password string `json:"password" binding:"required"`
}

type Enable2FAResponse struct {
	Secret    string `json:"secret"`
	QRCodeURL string `json:"qr_code_url"`
}

type Verify2FARequest struct {
	Code string `json:"code" binding:"required,len=6"`
}

// Login godoc
// @Summary Login user
// @Description Authenticate user with email and password
// @Tags auth
// @Accept json
// @Produce json
// @Param request body LoginRequest true "Login credentials"
// @Success 200 {object} LoginResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Router /auth/login [post]
func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	// Find user
	var user repo.User
	err := h.repo.DB().Where("email = ? AND is_active = ?", req.Email, true).First(&user).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusUnauthorized, ErrorResponse{Error: "Invalid credentials"})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Database error"})
		return
	}

	// Check password
	if err := auth.CheckPassword(req.Password, user.PasswordHash); err != nil {
		c.JSON(http.StatusUnauthorized, ErrorResponse{Error: "Invalid credentials"})
		return
	}

	// Update last login
	now := time.Now()
	user.LastLoginAt = &now
	h.repo.DB().Save(&user)

	// Generate tokens
	tokenPair, err := h.jwtMgr.GenerateTokenPair(user.ID, user.Email, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to generate tokens"})
		return
	}

	// Log audit
	h.logAudit(c, user.ID, "login", "user", &user.ID, map[string]interface{}{
		"email": user.Email,
		"ip":    c.ClientIP(),
	})

	response := LoginResponse{
		TokenPair:   tokenPair,
		User:        h.userToResponse(&user),
		Requires2FA: user.TwoFAEnabled,
	}

	c.JSON(http.StatusOK, response)
}

// RefreshToken godoc
// @Summary Refresh access token
// @Description Generate new access token using refresh token
// @Tags auth
// @Accept json
// @Produce json
// @Param request body RefreshTokenRequest true "Refresh token"
// @Success 200 {object} auth.TokenPair
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Router /auth/refresh [post]
func (h *AuthHandler) RefreshToken(c *gin.Context) {
	var req RefreshTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	tokenPair, err := h.jwtMgr.RefreshToken(req.RefreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, ErrorResponse{Error: "Invalid refresh token"})
		return
	}

	c.JSON(http.StatusOK, tokenPair)
}

// Enable2FA godoc
// @Summary Enable 2FA for user
// @Description Generate TOTP secret and QR code for 2FA setup
// @Tags auth
// @Accept json
// @Produce json
// @Param request body Enable2FARequest true "Password confirmation"
// @Success 200 {object} Enable2FAResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Router /auth/2fa/enable [post]
func (h *AuthHandler) Enable2FA(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{Error: "User not authenticated"})
		return
	}

	var req Enable2FARequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	// Get user
	var user repo.User
	err := h.repo.DB().First(&user, userID).Error
	if err != nil {
		c.JSON(http.StatusNotFound, ErrorResponse{Error: "User not found"})
		return
	}

	// Verify password
	if err := auth.CheckPassword(req.Password, user.PasswordHash); err != nil {
		c.JSON(http.StatusUnauthorized, ErrorResponse{Error: "Invalid password"})
		return
	}

	// Generate TOTP secret
	secret, err := h.totpMgr.GenerateSecret(user.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to generate 2FA secret"})
		return
	}

	// Save secret to user (not enabled yet)
	user.TwoFASecret = secret.Secret
	h.repo.DB().Save(&user)

	// Log audit
	h.logAudit(c, user.ID, "2fa_enable_initiated", "user", &user.ID, map[string]interface{}{
		"email": user.Email,
	})

	c.JSON(http.StatusOK, Enable2FAResponse{
		Secret:    secret.Secret,
		QRCodeURL: secret.QRCodeURL,
	})
}

// Verify2FA godoc
// @Summary Verify 2FA setup
// @Description Verify TOTP code and enable 2FA
// @Tags auth
// @Accept json
// @Produce json
// @Param request body Verify2FARequest true "TOTP code"
// @Success 200 {object} SuccessResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Router /auth/2fa/verify [post]
func (h *AuthHandler) Verify2FA(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{Error: "User not authenticated"})
		return
	}

	var req Verify2FARequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	// Get user
	var user repo.User
	err := h.repo.DB().First(&user, userID).Error
	if err != nil {
		c.JSON(http.StatusNotFound, ErrorResponse{Error: "User not found"})
		return
	}

	// Verify TOTP code
	if !h.totpMgr.ValidateCode(user.TwoFASecret, req.Code) {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid 2FA code"})
		return
	}

	// Enable 2FA
	user.TwoFAEnabled = true
	h.repo.DB().Save(&user)

	// Log audit
	h.logAudit(c, user.ID, "2fa_enabled", "user", &user.ID, map[string]interface{}{
		"email": user.Email,
	})

	c.JSON(http.StatusOK, SuccessResponse{Message: "2FA enabled successfully"})
}

// Verify2FALogin godoc
// @Summary Verify 2FA for login
// @Description Verify TOTP code during login process
// @Tags auth
// @Accept json
// @Produce json
// @Param request body TwoFARequest true "TOTP code"
// @Success 200 {object} LoginResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Router /auth/2fa/login [post]
func (h *AuthHandler) Verify2FALogin(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{Error: "User not authenticated"})
		return
	}

	var req TwoFARequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	// Get user
	var user repo.User
	err := h.repo.DB().First(&user, userID).Error
	if err != nil {
		c.JSON(http.StatusNotFound, ErrorResponse{Error: "User not found"})
		return
	}

	// Verify TOTP code
	if !h.totpMgr.ValidateCode(user.TwoFASecret, req.Code) {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid 2FA code"})
		return
	}

	// Generate final tokens
	tokenPair, err := h.jwtMgr.GenerateTokenPair(user.ID, user.Email, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to generate tokens"})
		return
	}

	// Log audit
	h.logAudit(c, user.ID, "2fa_login_verified", "user", &user.ID, map[string]interface{}{
		"email": user.Email,
	})

	response := LoginResponse{
		TokenPair:   tokenPair,
		User:        h.userToResponse(&user),
		Requires2FA: false,
	}

	c.JSON(http.StatusOK, response)
}

// Logout godoc
// @Summary Logout user
// @Description Logout user and invalidate session
// @Tags auth
// @Success 200 {object} SuccessResponse
// @Router /auth/logout [post]
func (h *AuthHandler) Logout(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if exists {
	// Log audit
	uid := userID.(uint)
	h.logAudit(c, uid, "logout", "user", &uid, map[string]interface{}{
		"ip": c.ClientIP(),
	})
	}

	c.JSON(http.StatusOK, SuccessResponse{Message: "Logged out successfully"})
}

// GetMe godoc
// @Summary Get current user
// @Description Get current authenticated user information
// @Tags auth
// @Produce json
// @Success 200 {object} UserResponse
// @Failure 401 {object} ErrorResponse
// @Router /me [get]
func (h *AuthHandler) GetMe(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{Error: "User not authenticated"})
		return
	}

	var user repo.User
	err := h.repo.DB().First(&user, userID).Error
	if err != nil {
		c.JSON(http.StatusNotFound, ErrorResponse{Error: "User not found"})
		return
	}

	c.JSON(http.StatusOK, h.userToResponse(&user))
}

func (h *AuthHandler) userToResponse(user *repo.User) *UserResponse {
	return &UserResponse{
		ID:           user.ID,
		Email:        user.Email,
		Role:         user.Role,
		TwoFAEnabled: user.TwoFAEnabled,
		IsActive:     user.IsActive,
		CreatedAt:    user.CreatedAt,
	}
}

func (h *AuthHandler) logAudit(c *gin.Context, userID uint, action, entity string, entityID *uint, meta map[string]interface{}) {
	auditLog := repo.AuditLog{
		UserID:    &userID,
		Action:    action,
		Entity:    entity,
		EntityID:  entityID,
		IP:        c.ClientIP(),
		UserAgent: c.GetHeader("User-Agent"),
	}

	// Convert meta to JSON string if provided
	if meta != nil {
		// Simple JSON conversion for demo
		auditLog.MetaJSON = `{"meta": "data"}`
	}

	h.repo.DB().Create(&auditLog)
}
