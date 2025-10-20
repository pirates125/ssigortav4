# EESigorta Portal Makefile

.PHONY: dev up down migrate seed test clean build

# Development
dev:
	@echo "Starting development environment..."
	docker-compose -f deployments/docker-compose.yml up -d postgres redis
	@echo "Waiting for services to be ready..."
	sleep 5
	@echo "Starting backend..."
	cd apps/backend && go run cmd/api/main.go &
	@echo "Starting frontend..."
	cd apps/frontend && npm run dev &
	@echo "Development environment started!"

# Docker Compose
up:
	docker-compose -f deployments/docker-compose.yml up -d

down:
	docker-compose -f deployments/docker-compose.yml down

# Database
migrate:
	@echo "Running database migrations..."
	docker-compose -f deployments/docker-compose.yml exec postgres psql -U ees_user -d eesigorta -f /migrations/0001_init.sql
	docker-compose -f deployments/docker-compose.yml exec postgres psql -U ees_user -d eesigorta -f /migrations/0002_indexes.sql

seed:
	@echo "Seeding database with demo data..."
	docker-compose -f deployments/docker-compose.yml exec postgres psql -U ees_user -d eesigorta -f /migrations/seed.sql

# Testing
test:
	@echo "Running backend tests..."
	cd apps/backend && go test ./...
	@echo "Running frontend tests..."
	cd apps/frontend && npm test

# Build
build:
	@echo "Building backend..."
	cd apps/backend && go build -o bin/api cmd/api/main.go
	@echo "Building frontend..."
	cd apps/frontend && npm run build

# Clean
clean:
	docker-compose -f deployments/docker-compose.yml down -v
	docker system prune -f

# Install dependencies
install:
	@echo "Installing backend dependencies..."
	cd apps/backend && go mod tidy
	@echo "Installing frontend dependencies..."
	cd apps/frontend && npm install

# Scraper test
test-scraper:
	@echo "Testing scraper..."
	cd apps/backend && go run cmd/api/main.go --test-scraper

# Queue monitor
queue-monitor:
	@echo "Starting Asynqmon..."
	docker-compose -f deployments/docker-compose.yml up -d asynqmon
	@echo "Queue monitor available at http://localhost:8080"
