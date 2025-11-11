# GitHub Copilot Instructions for Directus

## Project Overview

Directus is a real-time API and App dashboard for managing SQL database content. It's a monorepo that includes:

- **API** (`/api`) - Node.js backend with REST & GraphQL APIs
- **App** (`/app`) - Vue.js dashboard application
- **SDK** (`/sdk`) - TypeScript SDK for interacting with Directus
- **Packages** (`/packages/*`) - Shared packages and utilities

## Technology Stack

- **Language**: TypeScript, JavaScript
- **Runtime**: Node.js 22
- **Package Manager**: pnpm (>=10 <11)
- **Frontend Framework**: Vue.js 3
- **Build Tools**: Vite, Rollup, esbuild
- **Testing**: Vitest
- **Database Support**: PostgreSQL, MySQL, SQLite, OracleDB, CockroachDB, MariaDB, MS-SQL

## Development Setup

### Prerequisites

- Node.js 22
- pnpm >=10 <11

### Installation

```bash
pnpm install
```

### Building

```bash
# Build all packages
pnpm build

# Build specific workspace
pnpm --filter @directus/api build
```

## Code Quality Standards

### Linting

```bash
# Run ESLint
pnpm lint

# Run Stylelint
pnpm lint:style

# Format code with Prettier
pnpm format
```

### Testing

```bash
# Run all tests (excluding blackbox tests)
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run blackbox tests
pnpm test:blackbox

# Run tests in watch mode (in specific package)
cd packages/<package-name>
pnpm test:watch
```

### Code Style

- Use TypeScript for all new code
- Follow the existing ESLint and Prettier configurations
- No console statements in production code (controlled by NODE_ENV)
- Add blank lines between different statement types (enforced by ESLint)
- Use ES modules (`import/export` syntax)
- Prefer `const` over `let`, avoid `var`

## Project Structure

```
directus/
├── api/                  # Backend API (Node.js)
│   └── src/
├── app/                  # Frontend dashboard (Vue.js)
│   └── src/
├── sdk/                  # TypeScript SDK
│   └── src/
├── packages/             # Shared packages
│   ├── composables/      # Vue composables
│   ├── constants/        # Shared constants
│   ├── extensions/       # Extension system
│   ├── schema/           # Database schema utilities
│   ├── storage/          # Storage adapters
│   ├── types/            # TypeScript types
│   └── utils/            # Utility functions
└── tests/                # Test suites
```

## Testing Conventions

- Use Vitest for unit and integration tests
- Test files should be named `*.test.ts`
- Place tests next to the code they test
- Mock external dependencies using `vi.mock()`
- Use descriptive test names with `describe()` and `test()`

Example:

```typescript
import { describe, expect, test, vi } from 'vitest';

describe('function name', () => {
	test('should do something specific', () => {
		// Test implementation
	});
});
```

## Contributing Guidelines

### Pull Requests

- Follow the PR template provided in `.github/pull_request_template.md`
- Include scope, risks, tested scenarios, and review notes
- Add or update tests for new features
- Update documentation if needed
- Ensure all checks pass (lint, format, tests)

### Commits

- Use meaningful commit messages
- Follow conventional commit format when applicable
- Use changesets for version management (`@changesets/cli`)

### Code Review

- PRs are automatically checked for:
  - Linting (ESLint)
  - Style (Stylelint)
  - Formatting (Prettier)
  - Unit tests
  - Type checking (TypeScript)

## API Development

### Key Directories

- `/api/src/controllers/` - Request handlers
- `/api/src/services/` - Business logic
- `/api/src/database/` - Database utilities
- `/api/src/middleware/` - Express middleware
- `/api/src/utils/` - Utility functions

### Database

- Use Knex.js for query building
- Support multiple database vendors
- Never make breaking schema changes without migrations

## App Development

### Key Directories

- `/app/src/components/` - Vue components
- `/app/src/views/` - Page views
- `/app/src/composables/` - Vue composables
- `/app/src/stores/` - Pinia stores
- `/app/src/modules/` - Feature modules

### UI Guidelines

- Use existing components from the design system
- Follow Vue 3 Composition API patterns
- Use TypeScript for props and emits
- Ensure accessibility (a11y) standards

## SDK Development

- Maintain backward compatibility
- Provide TypeScript types for all exports
- Follow semantic versioning
- Update tests when adding new features

## Package Management

### Workspace Protocol

- Use `workspace:*` for internal dependencies
- Use `catalog:` for shared external dependencies (defined in `pnpm-workspace.yaml`)
- Catalog mode is strict - all versions must be defined in the catalog

### Adding Dependencies

1. Add to the catalog in `pnpm-workspace.yaml` if used by multiple packages
2. Use the catalog version: `"package": "catalog:"`
3. Run `pnpm install` to update lock file

## Common Tasks

### Creating a New Package

```bash
cd packages
mkdir my-package
cd my-package
pnpm init
# Add package.json configuration following existing patterns
```

### Running the Development Server

```bash
# API
cd api
pnpm dev

# App
cd app
pnpm dev
```

### Debugging

- Use `NODE_OPTIONS=--inspect` for debugging Node.js
- Use Vue DevTools for debugging the frontend
- Check logs in the console for API errors

## Security

- Never commit secrets or credentials
- Use environment variables for configuration
- Follow OWASP best practices
- Run CodeQL analysis (configured in `.github/workflows/codeql-analysis.yml`)

## Performance

- Be mindful of bundle size for frontend code
- Optimize database queries
- Use caching where appropriate
- Consider scalability in design decisions

## Documentation

- Main documentation: https://docs.directus.io
- Contributing guide: https://docs.directus.io/contributing/introduction
- Update documentation for new features at https://github.com/directus/docs

## Support Channels

- GitHub Issues: Bug reports and feature requests
- Discord: https://directus.chat (Live chat)
- Community: https://community.directus.io (Discussions)
- Twitter: @directus (Updates)

## License

Directus is licensed under BUSL-1.1 (Business Source License). Review the license file before contributing.
