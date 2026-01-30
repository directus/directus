# AGENTS.md

This file provides guidance to AI coding assistants when working with code in this repository.

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

Directus works with multiple SQL databases via Knex.js: PostgreSQL, MySQL, MariaDB, SQLite, MS SQL Server, OracleDB,
CockroachDB.

## Dependency Management

- Use `workspace:*` for internal package dependencies
- Use `catalog:` for external dependencies (versions defined in `pnpm-workspace.yaml`)
- Add new shared dependencies to the catalog first

## Changesets

All code changes require a changeset to document what changed for the release notes.

### Creating a Changeset

```bash
pnpm changeset
```

This interactive command will:

1. Ask which packages are affected
2. Ask whether the change is a major, minor, or patch (see versioning guidance below)
3. Prompt for a description of the change

### Changeset Description Format

**IMPORTANT**: All changeset descriptions must be written in **past tense**, as they document changes that have already
been made.

Examples:

- ✅ "Added support for multi-provider AI"
- ✅ "Fixed race condition in WebSocket connections"
- ✅ "Replaced deprecated `ldapjs` with `ldapts`"
- ❌ "Add support for multi-provider AI" (present tense - incorrect)
- ❌ "Adding support for multi-provider AI" (present continuous - incorrect)

### Versioning Guidelines

Follow semantic versioning:

- **Patch** (`0.0.x`) - Bug fixes, dependency updates, internal improvements that don't affect the public API
  - Example: "Fixed validation error in date field"

- **Minor** (`0.x.0`) - New features, enhancements to existing features, non-breaking changes
  - Example: "Added visual editing support to live preview"

- **Major** (`x.0.0`) - Breaking changes that require user action or code updates
  - Example: "Removed deprecated `GET /items` endpoint"

### Breaking Changes

When introducing a breaking change:

1. Use **major** version bump
2. In the changeset description, clearly document:
   - What changed (past tense)
   - Why it changed (if not obvious)
   - Migration steps or what users need to update

Example breaking change changeset:

```markdown
---
'@directus/api': major
---

Removed support for Node.js 18. Directus now requires Node.js 20 or higher.

**Migration**: Update your Node.js installation to version 20 or higher before upgrading.
```

## Pull Requests

### Code Quality Requirements

**IMPORTANT**: Before creating a pull request, ensure all linters and formatters pass successfully. This is a mandatory
requirement for all PRs.

Run these commands to verify code quality:

```bash
pnpm lint         # ESLint - checks JavaScript/TypeScript code
pnpm lint:style   # Stylelint - checks CSS/SCSS/Vue styles
pnpm format       # Prettier - checks code formatting
```

All three commands must pass with no errors before raising a PR. If any issues are found:

1. Many issues can be auto-fixed:
   - `pnpm lint --fix` - Auto-fix ESLint issues
   - `pnpm lint:style --fix` - Auto-fix Stylelint issues
   - `prettier --cache --write .` - Auto-format with Prettier

2. Review and manually fix any remaining issues that cannot be auto-fixed

### PR Template

When creating a new pull request, always use the PR template located at `.github/pull_request_template.md`. The template
includes:

- **Scope**: List what changed in the PR
- **Potential Risks / Drawbacks**: Document any risks or trade-offs
- **Tested Scenarios**: Describe how the changes were tested
- **Review Notes / Questions**: Highlight areas needing attention or questions for reviewers
- **Checklist**: Confirm tests, documentation, and OpenAPI updates

Replace the placeholder "Lorem ipsum" content with actual details about your changes. Always reference the related issue
at the bottom using `Fixes #<num>` format.

### Handling Change Requests

**IMPORTANT**: When you receive change requests or feedback on a pull request, you must create a **sub-PR** (a new pull
request) to address those changes. Do not directly push commits to the existing PR branch.

#### Why Sub-PRs?

- Maintains a clean review history
- Allows reviewers to evaluate changes in isolation
- Prevents mixing original work with requested changes
- Enables parallel work on multiple change requests

#### How to Create a Sub-PR

1. Create a new branch from the current PR branch:

   ```bash
   git checkout -b <original-branch>-fixes-1
   ```

2. Make the requested changes on the new branch

3. Create a new pull request that:
   - Targets the original PR branch (not `main`)
   - References the original PR in the description: "Addresses feedback from #<original-pr-num>"
   - Includes a clear description of what changed

4. Once the sub-PR is reviewed and merged into the original PR branch, the original PR will be updated automatically

#### Example Workflow

```bash
# Original PR branch: claude/feature-xyz
# Reviewer requests changes

# Create sub-PR branch
git checkout claude/feature-xyz
git checkout -b claude/feature-xyz-fixes-1

# Make changes, commit, and push
git add .
git commit -m "Address reviewer feedback on validation logic"
git push origin claude/feature-xyz-fixes-1

# Create PR: claude/feature-xyz-fixes-1 → claude/feature-xyz
```

**Note**: This sub-PR workflow applies when explicitly instructed to fix change requests. For minor fixes (typos,
formatting) or when working on your own PRs before initial review, direct commits to the PR branch are acceptable.
