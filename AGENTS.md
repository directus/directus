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

### Handling Change Requests (AI Agents Only)

> **Note**: This section applies only to AI coding agents. Human contributors should push commits directly to their PR
> branches as usual.

When triggering AI agents to resolve change requests or feedback on a pull request, they must create a **Sub-PR** (a new
pull request that bases to the original PR branch) to address those changes instead of pushing commits directly to the
existing PR branch.

#### Why Sub-PRs for AI Agents?

- Allows reviewers to evaluate AI-generated changes in isolation
- Maintains clear separation between original work and revisions
- Enables easier rollback if AI-generated fixes introduce issues
- Provides an additional review checkpoint for AI changes

<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, but it invokes Vite through `vp dev` and `vp build`.

## Vite+ Workflow

`vp` is a global binary that handles the full development lifecycle. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

### Start

- create - Create a new project from a template
- migrate - Migrate an existing project to Vite+
- config - Configure hooks and agent integration
- staged - Run linters on staged files
- install (`i`) - Install dependencies
- env - Manage Node.js versions

### Develop

- dev - Run the development server
- check - Run format, lint, and TypeScript type checks
- lint - Lint code
- fmt - Format code
- test - Run tests

### Execute

- run - Run monorepo tasks
- exec - Execute a command from local `node_modules/.bin`
- dlx - Execute a package binary without installing it as a dependency
- cache - Manage the task cache

### Build

- build - Build for production
- pack - Build libraries
- preview - Preview production build

### Manage Dependencies

Vite+ automatically detects and wraps the underlying package manager such as pnpm, npm, or Yarn through the `packageManager` field in `package.json` or package manager-specific lockfiles.

- add - Add packages to dependencies
- remove (`rm`, `un`, `uninstall`) - Remove packages from dependencies
- update (`up`) - Update packages to latest versions
- dedupe - Deduplicate dependencies
- outdated - Check for outdated packages
- list (`ls`) - List installed packages
- why (`explain`) - Show why a package is installed
- info (`view`, `show`) - View package information from the registry
- link (`ln`) / unlink - Manage local package links
- pm - Forward a command to the package manager

### Maintain

- upgrade - Update `vp` itself to the latest version

These commands map to their corresponding tools. For example, `vp dev --port 3000` runs Vite's dev server and works the same as Vite. `vp test` runs JavaScript tests through the bundled Vitest. The version of all tools can be checked using `vp --version`. This is useful when researching documentation, features, and bugs.

## Common Pitfalls

- **Using the package manager directly:** Do not use pnpm, npm, or Yarn directly. Vite+ can handle all package manager operations.
- **Always use Vite commands to run tools:** Don't attempt to run `vp vitest` or `vp oxlint`. They do not exist. Use `vp test` and `vp lint` instead.
- **Running scripts:** Vite+ built-in commands (`vp dev`, `vp build`, `vp test`, etc.) always run the Vite+ built-in tool, not any `package.json` script of the same name. To run a custom script that shares a name with a built-in command, use `vp run <script>`. For example, if you have a custom `dev` script that runs multiple services concurrently, run it with `vp run dev`, not `vp dev` (which always starts Vite's dev server).
- **Do not install Vitest, Oxlint, Oxfmt, or tsdown directly:** Vite+ wraps these tools. They must not be installed directly. You cannot upgrade these tools by installing their latest versions. Always use Vite+ commands.
- **Use Vite+ wrappers for one-off binaries:** Use `vp dlx` instead of package-manager-specific `dlx`/`npx` commands.
- **Import JavaScript modules from `vite-plus`:** Instead of importing from `vite` or `vitest`, all modules should be imported from the project's `vite-plus` dependency. For example, `import { defineConfig } from 'vite-plus';` or `import { expect, test, vi } from 'vite-plus/test';`. You must not install `vitest` to import test utilities.
- **Type-Aware Linting:** There is no need to install `oxlint-tsgolint`, `vp lint --type-aware` works out of the box.

## CI Integration

For GitHub Actions, consider using [`voidzero-dev/setup-vp`](https://github.com/voidzero-dev/setup-vp) to replace separate `actions/setup-node`, package-manager setup, cache, and install steps with a single action.

```yaml
- uses: voidzero-dev/setup-vp@v1
  with:
    cache: true
- run: vp check
- run: vp test
```

## Review Checklist for Agents

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to validate changes.
<!--VITE PLUS END-->
