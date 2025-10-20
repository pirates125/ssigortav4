package api

import (
	"net/http"
	"strconv"

	"eesigorta/backend/internal/repo"

	"github.com/gin-gonic/gin"
)

type QuoteHandler struct {
	repo *repo.Repository
}

func NewQuoteHandler(repo *repo.Repository) *QuoteHandler {
	return &QuoteHandler{repo: repo}
}

type QuoteRequest struct {
	CustomerID     uint   `json:"customer_id" binding:"required"`
	ProductID      uint   `json:"product_id" binding:"required"`
	VehiclePlate   string `json:"vehicle_plate"`
	VehicleYear    int    `json:"vehicle_year"`
	VehicleBrand   string `json:"vehicle_brand"`
	VehicleModel   string `json:"vehicle_model"`
	CoverageType   string `json:"coverage_type" binding:"required"` // kasko, trafik, dask, saglik
	StartDate      string `json:"start_date" binding:"required"`
	EndDate        string `json:"end_date" binding:"required"`
	AdditionalInfo string `json:"additional_info"`
}

type ScrapedQuoteResponse struct {
	ID             uint    `json:"id"`
	QuoteID        uint    `json:"quote_id"`
	CompanyName    string  `json:"company_name"`
	CompanyLogo    string  `json:"company_logo"`
	Premium        float64 `json:"premium"`
	CoverageAmount float64 `json:"coverage_amount"`
	Discount       float64 `json:"discount"`
	FinalPrice     float64 `json:"final_price"`
	Status         string  `json:"status"`
	ErrorMessage   string  `json:"error_message,omitempty"`
	ScrapedAt      string  `json:"scraped_at"`
}

// GetQuotes godoc
// @Summary List all quotes
// @Description Get paginated list of quotes
// @Tags quotes
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param page query int false "Page number"
// @Param pageSize query int false "Page size"
// @Success 200 {object} PaginationResponse
// @Router /quotes [get]
func (h *QuoteHandler) GetQuotes(c *gin.Context) {
	page, _ := c.Get("page")
	pageSize, _ := c.Get("page_size")

	quotes, total, err := h.repo.GetQuotes(page.(int), pageSize.(int))
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	totalPages := int(total) / pageSize.(int)
	if int(total)%pageSize.(int) > 0 {
		totalPages++
	}

	c.JSON(http.StatusOK, PaginationResponse{
		Data:       quotes,
		Total:      total,
		Page:       page.(int),
		PageSize:   pageSize.(int),
		TotalPages: totalPages,
	})
}

// GetQuote godoc
// @Summary Get quote by ID
// @Description Get quote details with scraped quotes from insurance companies
// @Tags quotes
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Quote ID"
// @Success 200 {object} repo.Quote
// @Router /quotes/{id} [get]
func (h *QuoteHandler) GetQuote(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid ID"})
		return
	}

	quote, err := h.repo.GetQuoteByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, ErrorResponse{Error: "Quote not found"})
		return
	}

	c.JSON(http.StatusOK, quote)
}

// CreateQuote godoc
// @Summary Create new quote request
// @Description Create a new quote request and trigger scraping from insurance companies
// @Tags quotes
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param quote body QuoteRequest true "Quote data"
// @Success 201 {object} repo.Quote
// @Router /quotes [post]
func (h *QuoteHandler) CreateQuote(c *gin.Context) {
	var req QuoteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	userID, _ := c.Get("user_id")

	quote := &repo.Quote{
		CustomerID:     req.CustomerID,
		ProductID:      req.ProductID,
		AgentID:        userID.(uint),
		VehiclePlate:   req.VehiclePlate,
		VehicleYear:    req.VehicleYear,
		VehicleBrand:   req.VehicleBrand,
		VehicleModel:   req.VehicleModel,
		CoverageType:   req.CoverageType,
		StartDate:      req.StartDate,
		EndDate:        req.EndDate,
		AdditionalInfo: req.AdditionalInfo,
		Status:         "pending",
	}

	if err := h.repo.CreateQuote(quote); err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	// TODO: Trigger async scraping job here
	// asynqClient.Enqueue(tasks.NewScrapeQuoteTask(quote.ID))

	c.JSON(http.StatusCreated, quote)
}

// GetQuoteComparison godoc
// @Summary Get quote comparison
// @Description Get all scraped quotes for comparison
// @Tags quotes
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Quote ID"
// @Success 200 {array} ScrapedQuoteResponse
// @Router /quotes/{id}/comparison [get]
func (h *QuoteHandler) GetQuoteComparison(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid ID"})
		return
	}

	scrapedQuotes, err := h.repo.GetScrapedQuotesByQuoteID(uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, scrapedQuotes)
}

// ApproveQuote godoc
// @Summary Approve a scraped quote
// @Description Approve a specific scraped quote and create policy
// @Tags quotes
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Quote ID"
// @Param scraped_quote_id path int true "Scraped Quote ID"
// @Success 200 {object} repo.Policy
// @Router /quotes/{id}/approve/{scraped_quote_id} [post]
func (h *QuoteHandler) ApproveQuote(c *gin.Context) {
	quoteID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid quote ID"})
		return
	}

	scrapedQuoteID, err := strconv.ParseUint(c.Param("scraped_quote_id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid scraped quote ID"})
		return
	}

	// Get quote
	quote, err := h.repo.GetQuoteByID(uint(quoteID))
	if err != nil {
		c.JSON(http.StatusNotFound, ErrorResponse{Error: "Quote not found"})
		return
	}

	// Get scraped quote
	scrapedQuote, err := h.repo.GetScrapedQuoteByID(uint(scrapedQuoteID))
	if err != nil {
		c.JSON(http.StatusNotFound, ErrorResponse{Error: "Scraped quote not found"})
		return
	}

	// Create policy
	policy := &repo.Policy{
		CustomerID:   quote.CustomerID,
		ProductID:    quote.ProductID,
		AgentID:      quote.AgentID,
		QuoteID:      &quote.ID,
		PolicyNumber: generatePolicyNumber(),
		StartDate:    quote.StartDate,
		EndDate:      quote.EndDate,
		Premium:      scrapedQuote.FinalPrice,
		Status:       "active",
		CompanyName:  scrapedQuote.CompanyName,
	}

	if err := h.repo.CreatePolicy(policy); err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	// Update quote status
	quote.Status = "approved"
	h.repo.UpdateQuote(quote)

	c.JSON(http.StatusOK, policy)
}

func generatePolicyNumber() string {
	// Simple policy number generator
	// In production, use a more sophisticated system
	return "POL-" + strconv.FormatInt(int64(1000000+len("temp")), 10)
}

// GetScrapedQuotes godoc
// @Summary Get scraped quotes for a quote
// @Description Get all scraped quotes for a specific quote ID
// @Tags Quotes
// @Accept json
// @Produce json
// @Param id path int true "Quote ID"
// @Success 200 {array} ScrapedQuoteResponse
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Security BearerAuth
// @Router /quotes/{id}/scraped [get]
func (h *QuoteHandler) GetScrapedQuotes(c *gin.Context) {
	quoteID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid quote ID"})
		return
	}

	scrapedQuotes, err := h.repo.GetScrapedQuotesByQuoteID(uint(quoteID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to fetch scraped quotes"})
		return
	}

	var response []ScrapedQuoteResponse
	for _, sq := range scrapedQuotes {
		response = append(response, ScrapedQuoteResponse{
			ID:             sq.ID,
			QuoteID:        sq.QuoteID,
			CompanyName:    sq.CompanyName,
			CompanyLogo:    sq.CompanyLogo,
			Premium:        sq.Premium,
			CoverageAmount: sq.CoverageAmount,
			Discount:       sq.Discount,
			FinalPrice:     sq.FinalPrice,
			Status:         sq.Status,
			ScrapedAt:      sq.ScrapedAt.Format("2006-01-02 15:04:05"),
		})
	}

	c.JSON(http.StatusOK, response)
}

