package main

import (
	"log"
	"net/http"

	"eesigorta/backend/internal/api"
	"eesigorta/backend/internal/auth"
	"eesigorta/backend/internal/config"
	"eesigorta/backend/internal/rbac"
	"eesigorta/backend/internal/repo"

	"github.com/gin-gonic/gin"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatal("Failed to load config:", err)
	}

	// Initialize database
	repository, err := repo.NewRepository(cfg)
	if err != nil {
		log.Fatal("Failed to initialize database:", err)
	}
	defer repository.Close()

	// Initialize JWT manager
	jwtMgr := auth.NewJWTManager(cfg.JWT.Secret, cfg.JWT.AccessTTL, cfg.JWT.RefreshTTL)

	// Initialize TOTP manager
	totpMgr := auth.NewTOTPManager(cfg.TOTP.Issuer)

	// Initialize RBAC manager
	rbacMgr := rbac.NewRBACManager(repository.DB())
	if err := rbacMgr.InitializeRoles(); err != nil {
		log.Fatal("Failed to initialize RBAC:", err)
	}

	// Initialize handlers
	authHandler := api.NewAuthHandler(repository, jwtMgr, totpMgr)
	customerHandler := api.NewCustomerHandler(repository)
	quoteHandler := api.NewQuoteHandler(repository)
	branchHandler := api.NewBranchHandler(repository)
	agentHandler := api.NewAgentHandler(repository)
	policyHandler := api.NewPolicyHandler(repository)
	reportHandler := api.NewReportHandler(repository)

	// Setup Gin router
	if cfg.App.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.New()

	// Middleware
	router.Use(gin.Logger())
	router.Use(gin.Recovery())
	router.Use(api.CORSMiddleware())
	router.Use(api.AuditMiddleware())

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// API routes
	apiV1 := router.Group("/api/v1")
	{
		// Auth routes (no auth required)
		auth := apiV1.Group("/auth")
		{
			auth.POST("/login", authHandler.Login)
			auth.POST("/refresh", authHandler.RefreshToken)
			auth.POST("/logout", authHandler.Logout)
		}

		// Protected routes
		protected := apiV1.Group("")
		protected.Use(api.AuthMiddleware(jwtMgr))
		{
			// User routes
			protected.GET("/me", authHandler.GetMe)
			protected.POST("/auth/2fa/enable", authHandler.Enable2FA)
			protected.POST("/auth/2fa/verify", authHandler.Verify2FA)
			protected.POST("/auth/2fa/login", authHandler.Verify2FALogin)

			// Customer routes
			customers := protected.Group("/customers")
			{
				customers.GET("", customerHandler.GetCustomers)
				customers.GET("/:id", customerHandler.GetCustomer)
				customers.POST("", customerHandler.CreateCustomer)
				customers.PUT("/:id", customerHandler.UpdateCustomer)
				customers.DELETE("/:id", customerHandler.DeleteCustomer)
			}

			// Quote routes
			quotes := protected.Group("/quotes")
			{
				quotes.GET("", quoteHandler.GetQuotes)
				quotes.GET("/:id", quoteHandler.GetQuote)
				quotes.POST("", quoteHandler.CreateQuote)
				quotes.GET("/:id/comparison", quoteHandler.GetQuoteComparison)
				quotes.GET("/:id/scraped", quoteHandler.GetScrapedQuotes)
				quotes.POST("/:id/approve/:scraped_quote_id", quoteHandler.ApproveQuote)
			}

			// Branch routes
			branches := protected.Group("/branches")
			{
				branches.GET("", branchHandler.GetBranches)
				branches.GET("/:id", branchHandler.GetBranch)
				branches.POST("", branchHandler.CreateBranch)
				branches.PUT("/:id", branchHandler.UpdateBranch)
				branches.DELETE("/:id", branchHandler.DeleteBranch)
			}

			// Agent routes
			agents := protected.Group("/agents")
			{
				agents.GET("", agentHandler.GetAgents)
				agents.GET("/:id", agentHandler.GetAgent)
				agents.POST("", agentHandler.CreateAgent)
				agents.PUT("/:id", agentHandler.UpdateAgent)
				agents.DELETE("/:id", agentHandler.DeleteAgent)
			}

			// Policy routes
			policies := protected.Group("/policies")
			{
				policies.GET("", policyHandler.GetPolicies)
				policies.GET("/:id", policyHandler.GetPolicy)
				policies.POST("", policyHandler.CreatePolicy)
				policies.PUT("/:id", policyHandler.UpdatePolicy)
				policies.DELETE("/:id", policyHandler.DeletePolicy)
			}

			// Report routes
			reports := protected.Group("/reports")
			{
				reports.GET("/dashboard", reportHandler.GetDashboardStats)
				reports.GET("/policy-stats", reportHandler.GetPolicyStats)
				reports.GET("/monthly-stats", reportHandler.GetMonthlyStats)
				reports.GET("/branch-stats", reportHandler.GetBranchStats)
				reports.GET("/agent-stats", reportHandler.GetAgentStats)
				reports.GET("/export/policies", reportHandler.ExportPolicies)
				reports.GET("/export/customers", reportHandler.ExportCustomers)
			}

			// Scraper routes
			scraper := protected.Group("/scraper")
			{
				scraper.GET("/targets", func(c *gin.Context) {
					targets, err := repository.GetScraperTargets()
					if err != nil {
						c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch scraper targets"})
						return
					}
					c.JSON(http.StatusOK, targets)
				})
				scraper.POST("/run", func(c *gin.Context) {
					c.JSON(http.StatusOK, gin.H{"message": "Scraper run endpoint - to be implemented"})
				})
			}
		}
	}

	// Start server
	log.Printf("Starting server on port %s", cfg.App.Port)
	if err := router.Run(":" + cfg.App.Port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
