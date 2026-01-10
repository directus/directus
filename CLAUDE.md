# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Directus is a real-time API and App dashboard for managing SQL database content. This is a custom fork (f2f-directus) with integrated OpenTelemetry observability and tenant configuration features.

**Monorepo structure:**
- `/api` - Node.js backend with REST & GraphQL APIs (Express, Knex.js)
- `/app` - Vue.js 3 dashboard application (Vite, Pinia)
- `/sdk` - TypeScript SDK with composable architecture (REST, GraphQL, Auth, Realtime modules)
- `/packages/*` - 30+ shared packages (storage drivers, extensions, types, utilities)
- `/observability` - OpenTelemetry configurations for Tempo/Loki/Prometheus (dev) and CloudWatch/X-Ray (prod)
- `/packer` - AWS AMI build configurations for production deployment

## Fork-Specific Changes (custom branch)

This is a fork of [directus/directus](https://github.com/directus/directus). The `custom` branch contains these additions vs upstream:

**To see fork-specific commits:**
```bash
git log upstream/main..HEAD --oneline
```

### OpenTelemetry Observability (`feature/opentelemetry`)
- Full OpenTelemetry instrumentation for API (traces, logs, metrics)
- Pino logger integration with OTLP exporters
- `/observability` directory with collector configs
- Development: Tempo, Loki, Prometheus, Grafana stack
- Production: AWS CloudWatch Logs/Metrics and X-Ray traces

### AWS Packer AMI Builds (`feature/packer`)
- `/packer` - HashiCorp Packer templates for building Directus AMIs
- `/.github/workflows/ami-build.yml` - CI workflow for AMI builds
- Tenant configuration scripts (`configure-tenant.sh`)
- PM2 process management, nginx reverse proxy, CloudWatch agent
- Template cloning at boot via `TEMPLATE_VERSION` env var

### $FORM Context (`feature/form-context`)
- New `$FORM` variable for use in field conditions and filters
- Access parent form values in nested M2M/O2M relationships
- `app/src/composables/use-parent-form-context.ts`
- Enables dynamic field behavior based on sibling field values

### Draft Items (`feature/draft-items`)
- `directus_drafts` system collection for work-in-progress items
- `DraftsService` with save, validate, and publish operations
- Draft-aware UI in item editor with naming dialog
- `app/src/composables/use-draft-item.ts`

### External MCP Tools (`feature/external-mcp-tools`)
- Connect AI Chat to external MCP (Model Context Protocol) servers
- HTTP/SSE transport with Bearer/Basic auth support
- `ai_mcp_external_servers` settings field
- `/ai/chat/tools` endpoint for listing available tools

### URL Prefill Composable
- `app/src/modules/content/composables/use-url-prefill.ts`
- Prefill form fields from URL query parameters

### File Content AI Tool
- `api/src/ai/tools/file-content/` - Extract text from uploaded files for AI context

## Build & Development Commands

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Build specific workspace
pnpm --filter @directus/api build

# Run linting and formatting
pnpm lint              # ESLint
pnpm lint:style        # Stylelint for CSS/SCSS/Vue
pnpm format            # Prettier check

# Run tests
pnpm test              # All tests (excluding blackbox)
pnpm test:coverage     # Tests with coverage
pnpm test:blackbox     # E2E tests (builds first, slower)

# Development servers
cd api && pnpm dev     # API with live reload
cd app && pnpm dev     # Vite dev server

# Run single test file (in package directory)
cd packages/<package-name>
pnpm test <test-file>
pnpm test:watch        # Watch mode
```

## Git Worktree Workflow

This repo uses [git-worktree-runner](https://github.com/coderabbitai/git-worktree-runner) (`gtr`) for working on multiple branches simultaneously in isolated directories. Each worktree gets its own Docker services with unique ports.

**Installation:**
```bash
git clone https://github.com/coderabbitai/git-worktree-runner.git
cd git-worktree-runner
./install.sh
```

**Common commands:**
```bash
git gtr new my-feature          # Create worktree (runs full setup)
git gtr new my-feature --ai     # Create and launch Claude Code
git gtr list                    # Show all worktrees
git gtr ai my-feature           # Open Claude Code in existing worktree
git gtr rm my-feature           # Remove worktree
```

**What happens on `git gtr new`:**
1. Creates the worktree directory
2. Copies environment files from main repo (`.env.observability`, etc.)
3. Generates `.env` with unique port variables (based on path hash)
4. Generates `api/.env` with matching database ports
5. Runs `pnpm install` and `pnpm build`
6. Starts postgres via `docker compose up -d postgres`
7. Runs `pnpm cli bootstrap` in the api directory

**Managing services:**
```bash
# The setup script only starts postgres by default
# To start additional services:
docker compose up -d postgres redis minio

# Or run the setup script manually with options:
./scripts/gtr-setup.sh --services postgres,redis,otel-collector
./scripts/gtr-setup.sh --skip-bootstrap   # Skip bootstrap step

# Work with worktrees without leaving main directory:
git gtr run my-feature pnpm dev           # Run command in worktree
git gtr run my-feature docker compose ps  # Check docker status
```

**Port allocation:**
Each worktree gets a unique port offset (0-9900) based on its directory path hash. The `docker-compose.yml` uses environment variables with defaults (`${POSTGRES_PORT:-5100}`), and each worktree's `.env` file sets these to unique values.

Example ports:
- Main repo: postgres on 5100 (default)
- Worktree A: postgres on 12300
- Worktree B: postgres on 8500

Check your worktree's ports in `.env` or `api/.env`.

## Testing

- Framework: Vitest
- Test files: `*.test.ts` colocated with source
- Mock external dependencies with `vi.mock()`
- Use `describe()` and `test()` with descriptive names

## Package Management

- Uses pnpm workspaces with **strict catalog mode**
- Internal dependencies: `"workspace:*"`
- External dependencies: `"catalog:"` (versions defined in `pnpm-workspace.yaml`)
- To add a new shared dependency: add version to catalog in `pnpm-workspace.yaml`, then use `"catalog:"` in package.json

## Key Architecture Patterns

**API (Express):**
- `/api/src/controllers/` - Route handlers (25+ controllers)
- `/api/src/services/` - Business logic layer
- `/api/src/middleware/` - Express middleware pipeline
- `/api/src/database/` - Knex.js utilities and migrations
- Multi-database support: PostgreSQL, MySQL, SQLite, OracleDB, CockroachDB, MariaDB, MS-SQL

**App (Vue.js):**
- Composition API with TypeScript
- `/app/src/stores/` - Pinia stores for global state
- `/app/src/composables/` - Vue composables
- `/app/src/modules/` - Feature modules
- Histoire for component documentation: `cd app && pnpm story:dev`

**SDK:**
- Composable client factory pattern
- Zero external dependencies
- Features: REST, GraphQL, Auth, Realtime (WebSocket)

**Extension System:**
- Plugin architecture in `/packages/extensions/`
- Extension SDK in `/packages/extensions-sdk/`
- Rollup-based bundling

## OpenTelemetry Observability

Three signals: Traces, Logs, Metrics with Pino integration.

**Development stack:** Tempo, Loki, Prometheus, Grafana
```bash
docker compose up -d otel-collector tempo loki prometheus grafana
```

**Key env variables:**
- `OPENTELEMETRY_ENABLED=true`
- `OPENTELEMETRY_SERVICE_NAME=directus-api`
- `OPENTELEMETRY_EXPORTER_OTLP_ENDPOINT=http://localhost:4318`

See `/observability/README.md` for production AWS CloudWatch/X-Ray setup.

## Code Style

- TypeScript for all new code
- ES modules (`import/export`)
- Prefer `const` over `let`, no `var`
- No console/debugger in production (NODE_ENV check)
- Max line width: 120 characters
- Single quotes, no semicolons
- Blank lines between different statement types (ESLint enforced)
- Vue: script-template-style block order

## Database Development

- Use Knex.js for query building
- Support all database vendors - test across them when possible
- Never make breaking schema changes without migrations
- Development databases available via `docker-compose.yml` (PostgreSQL:5100, MySQL:5101, etc.)
