# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Directus is a real-time API and App dashboard for managing SQL database content. This is a pnpm monorepo containing:

- **`/api`** - Node.js backend with REST & GraphQL APIs (Express.js, Knex.js)
- **`/app`** - Vue 3 dashboard application (Vite, Pinia)
- **`/sdk`** - TypeScript SDK for Directus API clients
- **`/packages/*`** - 35+ shared packages (types, utils, storage drivers, extensions, etc.)

## Requirements

- Node.js 22
- pnpm >=10 <11

## Common Commands

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Build specific package
pnpm --filter @directus/api build

# Run development servers (API on :8055, App on :8080)
cd api && pnpm dev    # API with hot reload
cd app && pnpm dev    # App with Vite HMR

# Linting and formatting
pnpm lint             # ESLint
pnpm lint:style       # Stylelint for CSS/SCSS/Vue
pnpm format           # Prettier check

# Testing
pnpm test                           # Run all unit tests
pnpm --filter @directus/api test    # Test specific package
cd api && pnpm test:watch           # Watch mode in package
pnpm test:coverage                  # Coverage report

# Blackbox/E2E tests (requires building first)
pnpm test:blackbox
TEST_DB=postgres pnpm test:blackbox  # Against specific database
```

## Architecture

### API (`/api/src`)

- **`controllers/`** - REST API endpoint handlers (40+ controllers)
- **`services/`** - Business logic layer
- **`database/`** - Knex.js database utilities and migrations
- **`middleware/`** - Express middleware (auth, caching, rate limiting)
- **`auth/`** - Authentication providers (LDAP, SAML, OAuth, local)
- **`extensions/`** - Runtime extension loading
- **`websocket/`** - Real-time WebSocket support

### App (`/app/src`)

- **`components/`** - 145+ Vue components
- **`views/`** - Page views
- **`composables/`** - 53+ Vue composables
- **`stores/`** - 24 Pinia stores
- **`interfaces/`** - 45+ field input types
- **`displays/`** - 21 field display renderers
- **`layouts/`** - 8 data layout views
- **`operations/`** - 18 flow operation types
- **`panels/`** - 14 dashboard panel types
- **`modules/`** - Feature modules

### Key Shared Packages

- **`@directus/types`** - Shared TypeScript types
- **`@directus/utils`** - Shared utilities (node/browser/shared)
- **`@directus/schema`** - Database schema utilities
- **`@directus/extensions`** - Extension framework
- **`@directus/storage`** - Abstract storage interface
- **`@directus/storage-driver-*`** - Storage backends (S3, Azure, GCS, Local, etc.)

## Code Style

- TypeScript for all new code
- ES modules (`import/export` syntax)
- Prefer `const` over `let`, avoid `var`
- Follow existing ESLint and Prettier configurations
- Test files named `*.test.ts`, placed next to source files

## Testing Conventions

```typescript
import { describe, expect, test, vi } from 'vitest';

describe('function name', () => {
	test('should do something specific', () => {
		// Test implementation
	});
});
```

## Database Support

Directus works with multiple SQL databases via Knex.js: PostgreSQL, MySQL, MariaDB, SQLite, MS SQL Server, OracleDB, CockroachDB.

## Dependency Management

- Use `workspace:*` for internal package dependencies
- Use `catalog:` for external dependencies (versions defined in `pnpm-workspace.yaml`)
- Add new shared dependencies to the catalog first
