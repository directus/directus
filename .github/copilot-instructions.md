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
- Community: https://community.directus.io (Discussions)
- Twitter: @directus (Updates)

## License

Directus is licensed under BUSL-1.1 (Business Source License). Review the license file before contributing.

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
