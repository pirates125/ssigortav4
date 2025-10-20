package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	apih "eesigorta/backend/internal/api" // <-- package alias çakışmasını önledik
	"eesigorta/backend/internal/auth"
	"eesigorta/backend/internal/config"
	"eesigorta/backend/internal/rbac"
	"eesigorta/backend/internal/repo"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

/***************
 * TEST SETUP  *
 ***************/

type TestDeps struct {
	DB       *gorm.DB
	Repo     *repo.Repository
	JWTMgr   *auth.JWTManager
	TOTPMgr  *auth.TOTPManager
	RBACMgr  *rbac.Manager
	Router   *gin.Engine
	JWTConf  config.JWTConfig
	TOTPConf config.TOTPConfig
}

func setupTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err, "failed to connect to test database")

	// Auto-migrate tables
	err = db.AutoMigrate(
		&repo.User{},
		&repo.Branch{},
		&repo.Agent{},
		&repo.Customer{},
		&repo.Product{},
		&repo.Quote{},
		&repo.Policy{},
		&repo.Account{},
		&repo.Payment{},
		&repo.AuditLog{},
		&repo.ScraperTarget{},
		&repo.ScraperRun{},
		&repo.ScrapedRow{},
		&repo.Permission{},
		&repo.Role{},
		&repo.RolePermission{},
	)
	require.NoError(t, err, "auto-migrate failed")

	return db
}

func setupTestDeps(t *testing.T) *TestDeps {
	t.Helper()

	gin.SetMode(gin.TestMode)

	db := setupTestDB(t)

	// Repository; alan ismi senin projende farklıysa (DB/db) uyarlayabilirsin
	r := &repo.Repository{DB: db}

	cfg := &config.Config{
		JWT: config.JWTConfig{
			Secret:     "test-secret",
			AccessTTL:  15,  // minutes
			RefreshTTL: 168, // hours (7d)
		},
		TOTP: config.TOTPConfig{
			Issuer: "TestEESigorta",
		},
	}

	jwtMgr := auth.NewJWTManager(cfg.JWT.Secret, cfg.JWT.AccessTTL, cfg.JWT.RefreshTTL)
	totpMgr := auth.NewTOTPManager(cfg.TOTP.Issuer)
	rbacMgr := rbac.NewRBACManager(db)

	// RBAC seed
	require.NoError(t, rbacMgr.InitializeRoles(), "rbac initialize failed")

	authHandler := apih.NewAuthHandler(r, jwtMgr, totpMgr)
	customerHandler := apih.NewCustomerHandler(r)

	router := gin.New()

	// Routes
	apiV1 := router.Group("/api/v1") // <-- 'api' DEĞİL, alias çakışması yok
	{
		authGroup := apiV1.Group("/auth")
		{
			authGroup.POST("/login", authHandler.Login)
			authGroup.POST("/refresh", authHandler.RefreshToken)
			authGroup.POST("/logout", authHandler.Logout)
		}

		protected := apiV1.Group("")
		protected.Use(apih.AuthMiddleware(jwtMgr)) // <-- package fonksiyonu
		{
			protected.GET("/me", authHandler.GetMe)
			protected.POST("/auth/2fa/enable", authHandler.Enable2FA)
			protected.POST("/auth/2fa/verify", authHandler.Verify2FA)
			protected.POST("/auth/2fa/login", authHandler.Verify2FALogin)

			customers := protected.Group("/customers")
			customers.Use(apih.PaginationMiddleware())
			{
				customers.GET("", apih.RBACMiddleware(rbacMgr, rbac.PermissionCustomerList), customerHandler.GetCustomers)
				customers.GET("/:id", apih.RBACMiddleware(rbacMgr, rbac.PermissionCustomerRead), customerHandler.GetCustomer)
				customers.POST("", apih.RBACMiddleware(rbacMgr, rbac.PermissionCustomerCreate), customerHandler.CreateCustomer)
				customers.PUT("/:id", apih.RBACMiddleware(rbacMgr, rbac.PermissionCustomerUpdate), customerHandler.UpdateCustomer)
				customers.DELETE("/:id", apih.RBACMiddleware(rbacMgr, rbac.PermissionCustomerDelete), customerHandler.DeleteCustomer)
			}
		}
	}

	return &TestDeps{
		DB:       db,
		Repo:     r,
		JWTMgr:   jwtMgr,
		TOTPMgr:  totpMgr,
		RBACMgr:  rbacMgr,
		Router:   router,
		JWTConf:  cfg.JWT,
		TOTPConf: cfg.TOTP,
	}
}

/***************
 *   TESTS     *
 ***************/

func TestLogin(t *testing.T) {
	td := setupTestDeps(t)

	// seed user into THE SAME DB used by router
	hashedPassword, err := auth.HashPassword("password123")
	require.NoError(t, err)

	user := repo.User{
		Email:        "test@example.com",
		PasswordHash: hashedPassword,
		Role:         "admin",
		IsActive:     true,
	}
	require.NoError(t, td.DB.Create(&user).Error)

	loginData := map[string]string{
		"email":    "test@example.com",
		"password": "password123",
	}
	jsonData, _ := json.Marshal(loginData)

	req, _ := http.NewRequest("POST", "/api/v1/auth/login", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	td.Router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code, w.Body.String())

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	assert.Contains(t, response, "token_pair")
	assert.Contains(t, response, "user")
	// bazı JSON encoder'larda bool string gelebilir; tip güvenliğini sağlayalım
	switch v := response["requires_2fa"].(type) {
	case bool:
		assert.False(t, v)
	default:
		assert.Equal(t, "false", v) // ihtiyat
	}
}

func TestLoginInvalidCredentials(t *testing.T) {
	td := setupTestDeps(t)

	loginData := map[string]string{
		"email":    "nonexistent@example.com",
		"password": "wrongpassword",
	}
	jsonData, _ := json.Marshal(loginData)

	req, _ := http.NewRequest("POST", "/api/v1/auth/login", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	td.Router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code, w.Body.String())
}

func TestGetMe(t *testing.T) {
	td := setupTestDeps(t)

	hashedPassword, err := auth.HashPassword("password123")
	require.NoError(t, err)

	user := repo.User{
		Email:        "test@example.com",
		PasswordHash: hashedPassword,
		Role:         "admin",
		IsActive:     true,
	}
	require.NoError(t, td.DB.Create(&user).Error)

	tokenPair, err := td.JWTMgr.GenerateTokenPair(user.ID, user.Email, user.Role)
	require.NoError(t, err)

	req, _ := http.NewRequest("GET", "/api/v1/me", nil)
	req.Header.Set("Authorization", "Bearer "+tokenPair.AccessToken)

	w := httptest.NewRecorder()
	td.Router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code, w.Body.String())

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	assert.Equal(t, float64(user.ID), response["id"])
	assert.Equal(t, user.Email, response["email"])
	assert.Equal(t, user.Role, response["role"])
}

func TestCreateCustomer(t *testing.T) {
	td := setupTestDeps(t)

	hashedPassword, err := auth.HashPassword("password123")
	require.NoError(t, err)

	user := repo.User{
		Email:        "admin@example.com",
		PasswordHash: hashedPassword,
		Role:         "admin",
		IsActive:     true,
	}
	require.NoError(t, td.DB.Create(&user).Error)

	tokenPair, err := td.JWTMgr.GenerateTokenPair(user.ID, user.Email, user.Role)
	require.NoError(t, err)

	customerData := map[string]interface{}{
		"tc_vkn": "12345678901",
		"name":   "Test Customer",
		"email":  "customer@example.com",
		"phone":  "0555 123 45 67",
		"city":   "İstanbul",
	}
	jsonData, _ := json.Marshal(customerData)

	req, _ := http.NewRequest("POST", "/api/v1/customers", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+tokenPair.AccessToken)

	w := httptest.NewRecorder()
	td.Router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code, w.Body.String())

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	assert.Equal(t, "12345678901", response["tc_vkn"])
	assert.Equal(t, "Test Customer", response["name"])
	assert.Equal(t, "customer@example.com", response["email"])
}

func TestGetCustomers(t *testing.T) {
	td := setupTestDeps(t)

	hashedPassword, err := auth.HashPassword("password123")
	require.NoError(t, err)

	user := repo.User{
		Email:        "admin@example.com",
		PasswordHash: hashedPassword,
		Role:         "admin",
		IsActive:     true,
	}
	require.NoError(t, td.DB.Create(&user).Error)

	tokenPair, err := td.JWTMgr.GenerateTokenPair(user.ID, user.Email, user.Role)
	require.NoError(t, err)

	// seed customers to the SAME DB
	customers := []repo.Customer{
		{TCVKN: "12345678901", Name: "Customer 1", Email: "customer1@example.com"},
		{TCVKN: "12345678902", Name: "Customer 2", Email: "customer2@example.com"},
	}
	for _, c := range customers {
		require.NoError(t, td.DB.Create(&c).Error)
	}

	req, _ := http.NewRequest("GET", "/api/v1/customers", nil)
	req.Header.Set("Authorization", "Bearer "+tokenPair.AccessToken)

	w := httptest.NewRecorder()
	td.Router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code, w.Body.String())

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	assert.Contains(t, response, "data")
	assert.Contains(t, response, "total")
	assert.Equal(t, float64(2), response["total"])
}

func TestRBACPermissions(t *testing.T) {
	td := setupTestDeps(t)

	hashedPassword, err := auth.HashPassword("password123")
	require.NoError(t, err)

	user := repo.User{
		Email:        "viewer@example.com",
		PasswordHash: hashedPassword,
		Role:         "viewer",
		IsActive:     true,
	}
	require.NoError(t, td.DB.Create(&user).Error)

	tokenPair, err := td.JWTMgr.GenerateTokenPair(user.ID, user.Email, user.Role)
	require.NoError(t, err)

	customerData := map[string]interface{}{
		"tc_vkn": "12345678901",
		"name":   "Test Customer",
	}
	jsonData, _ := json.Marshal(customerData)

	req, _ := http.NewRequest("POST", "/api/v1/customers", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+tokenPair.AccessToken)

	w := httptest.NewRecorder()
	td.Router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusForbidden, w.Code, w.Body.String())
}

func TestHealthCheck(t *testing.T) {
	router := gin.New()
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	req, _ := http.NewRequest("GET", "/health", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code, w.Body.String())

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	assert.Equal(t, "ok", response["status"])
}