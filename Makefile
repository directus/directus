.PHONY: dev staging prod dev-logs dev-stop dev-reset migrations seed test build-extensions schema-export schema-lint help

# Colors for output
BLUE=\033[0;34m
GREEN=\033[0;32m
YELLOW=\033[1;33m
NC=\033[0m # No Color

help: ## Show this help message
	@echo "$(BLUE)DirectApp - Development Commands$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""

##@ Development Environment

dev: ## Start development environment
	@echo "$(BLUE)🚀 Starting development environment...$(NC)"
	@cp -n .env.development.example .env || true
	@docker compose -f docker-compose.development.yml up -d
	@echo "$(GREEN)✅ Directus available at http://localhost:8055$(NC)"
	@echo "$(GREEN)📊 Adminer available at http://localhost:8080$(NC)"
	@echo "$(GREEN)📧 MailHog available at http://localhost:8025$(NC)"
	@echo ""
	@echo "$(YELLOW)💡 Tip: Run 'make dev-logs' to watch logs$(NC)"

dev-logs: ## Watch development logs
	@docker compose -f docker-compose.development.yml logs -f directus

dev-stop: ## Stop development environment
	@echo "$(BLUE)⏹️  Stopping development environment...$(NC)"
	@docker compose -f docker-compose.development.yml down
	@echo "$(GREEN)✅ Stopped$(NC)"

dev-reset: ## Reset development database (WARNING: deletes all data)
	@echo "$(YELLOW)⚠️  WARNING: This will delete all data!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker compose -f docker-compose.development.yml down -v; \
		docker compose -f docker-compose.development.yml up -d; \
		echo "$(GREEN)✅ Database reset$(NC)"; \
	fi

##@ Database

migrations: ## Run all pending migrations
	@echo "$(BLUE)📝 Running migrations...$(NC)"
	@docker compose -f docker-compose.development.yml exec -T database psql -U directus -d directus < migrations/001_extend_dealership.sql
	@docker compose -f docker-compose.development.yml exec -T database psql -U directus -d directus < migrations/002_add_dealership_to_users.sql
	@docker compose -f docker-compose.development.yml exec -T database psql -U directus -d directus < migrations/003_extend_cars_workflow.sql
	@docker compose -f docker-compose.development.yml exec -T database psql -U directus -d directus < migrations/004_create_notifications.sql
	@docker compose -f docker-compose.development.yml exec -T database psql -U directus -d directus < migrations/005_create_resource_management.sql
	@echo "$(GREEN)✅ Migrations complete$(NC)"

seed: ## Seed development data (dealerships, users, resources)
	@echo "$(BLUE)🌱 Seeding development data...$(NC)"
	@docker compose -f docker-compose.development.yml exec -T database psql -U directus -d directus < migrations/006_seed_development_data.sql
	@echo "$(GREEN)✅ Seed data loaded$(NC)"

db-shell: ## Open PostgreSQL shell
	@docker compose -f docker-compose.development.yml exec database psql -U directus -d directus

##@ Extensions

build-extensions: ## Build all extensions
	@echo "$(BLUE)🔧 Building extensions...$(NC)"
	@cd extensions && pnpm install && pnpm build
	@echo "$(GREEN)✅ Extensions built$(NC)"

test: ## Run extension tests
	@echo "$(BLUE)🧪 Running tests...$(NC)"
	@cd extensions && pnpm test

test-watch: ## Run extension tests in watch mode
	@cd extensions && pnpm test:watch

##@ Schema Management

schema-export: ## Export current schema snapshot
	@echo "$(BLUE)📸 Exporting schema snapshot...$(NC)"
	@./schema/scripts/export.sh dev
	@echo "$(GREEN)✅ Schema exported to schema/snapshots/dev.json$(NC)"

schema-lint: ## Check for security issues in permissions
	@echo "$(BLUE)🔍 Linting permissions...$(NC)"
	@./schema/scripts/lint-permissions.sh dev

schema-diff: ## Compare dev vs staging schema
	@./schema/scripts/diff.sh dev staging

schema-apply-staging: ## Apply dev schema to staging
	@echo "$(YELLOW)⚠️  Applying schema to staging...$(NC)"
	@./schema/scripts/apply.sh staging
	@echo "$(GREEN)✅ Schema applied to staging$(NC)"

schema-apply-prod: ## Apply dev schema to production (USE WITH CAUTION)
	@echo "$(YELLOW)⚠️  WARNING: Applying to PRODUCTION!$(NC)"
	@read -p "Are you absolutely sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		./schema/scripts/apply.sh prod; \
		echo "$(GREEN)✅ Schema applied to production$(NC)"; \
	fi

##@ Workflow Testing

workflow-test: ## Test workflow state transitions
	@echo "$(BLUE)🔄 Testing workflow state machine...$(NC)"
	@echo "Creating test nybil..."
	@curl -X POST http://localhost:8055/items/cars \
		-H "Authorization: Bearer \$${ADMIN_TOKEN}" \
		-H "Content-Type: application/json" \
		-d '{"vin": "TEST123456789TEST", "car_type": "nybil", "dealership_id": "1"}'
	@echo ""
	@echo "$(GREEN)✅ Check Directus logs for workflow validation$(NC)"

##@ Deployment

staging-deploy: ## Deploy to staging
	@echo "$(BLUE)🚀 Deploying to staging...$(NC)"
	@docker compose -f docker-compose.staging.yml up -d
	@echo "$(GREEN)✅ Staging deployed$(NC)"

staging-logs: ## Watch staging logs
	@docker compose -f docker-compose.staging.yml logs -f directus

prod-deploy: ## Deploy to production (USE WITH CAUTION)
	@echo "$(YELLOW)⚠️  WARNING: Deploying to PRODUCTION!$(NC)"
	@read -p "Are you absolutely sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker compose -f docker-compose.production.yml up -d; \
		echo "$(GREEN)✅ Production deployed$(NC)"; \
	fi

##@ Quick Start

quickstart: dev migrations seed build-extensions ## Complete setup: start dev + migrations + seed + build
	@echo ""
	@echo "$(GREEN)✅ QuickStart complete!$(NC)"
	@echo "$(BLUE)📝 Next steps:$(NC)"
	@echo "  1. Open http://localhost:8055/admin"
	@echo "  2. Login: admin@dev.local / DevPassword123!"
	@echo "  3. Start configuring collections (Issue #22)"
	@echo ""

check: schema-lint test ## Run all checks (lint + test)
	@echo "$(GREEN)✅ All checks passed$(NC)"

##@ Cleanup

clean: ## Clean up build artifacts
	@echo "$(BLUE)🧹 Cleaning up...$(NC)"
	@cd extensions && rm -rf dist node_modules
	@docker compose -f docker-compose.development.yml down
	@echo "$(GREEN)✅ Cleaned$(NC)"

clean-all: clean ## Clean up everything including volumes
	@docker compose -f docker-compose.development.yml down -v
	@docker compose -f docker-compose.staging.yml down -v
	@docker compose -f docker-compose.production.yml down -v
	@echo "$(GREEN)✅ All environments cleaned$(NC)"
