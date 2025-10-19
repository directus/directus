---
name: "Directus Development Workflow"
description: "Complete development setup: scaffolding, TypeScript, testing, CI/CD, Docker, deployment, and best practices"
version: 1.0.0
author: "Directus Development System"
tags: ["directus", "workflow", "testing", "docker", "ci-cd", "typescript", "deployment", "devops"]
---

# Directus Development Workflow

## Overview

This skill provides comprehensive guidance for setting up and maintaining professional Directus development workflows. Master project scaffolding, TypeScript configuration, testing strategies, continuous integration/deployment, Docker containerization, multi-environment management, and development best practices for building scalable Directus applications.

## When to Use This Skill

- Setting up new Directus projects
- Configuring TypeScript for type safety
- Implementing testing strategies
- Setting up CI/CD pipelines
- Containerizing with Docker
- Managing multiple environments
- Implementing database migrations
- Setting up development tools
- Optimizing build processes
- Deploying to production

## Project Setup

### Step 1: Initialize Directus Project

```bash
# Create project directory
mkdir my-directus-project && cd my-directus-project

# Initialize package.json
npm init -y

# Install Directus
npm install directus

# Initialize Directus
npx directus init

# Project structure
my-directus-project/
├── .env                     # Environment variables
├── .gitignore               # Git ignore rules
├── docker-compose.yml       # Docker configuration
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript config
├── uploads/                 # File uploads directory
├── extensions/              # Custom extensions
│   ├── endpoints/
│   ├── hooks/
│   ├── interfaces/
│   ├── displays/
│   ├── layouts/
│   ├── modules/
│   ├── operations/
│   └── panels/
├── migrations/              # Database migrations
├── seeders/                 # Database seeders
├── tests/                   # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── scripts/                 # Utility scripts
├── docs/                    # Documentation
└── .github/                 # GitHub workflows
    └── workflows/
```

### Step 2: Environment Configuration

```bash
# .env.example
# Database
DB_CLIENT="pg"
DB_HOST="localhost"
DB_PORT="5432"
DB_DATABASE="directus"
DB_USER="directus"
DB_PASSWORD="directus"

# Security
KEY="your-random-secret-key"
SECRET="your-random-secret"

# Admin
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="admin"

# Server
PUBLIC_URL="http://localhost:8055"
PORT=8055

# Storage
STORAGE_LOCATIONS="local,s3"
STORAGE_LOCAL_DRIVER="local"
STORAGE_LOCAL_ROOT="./uploads"

# S3 Storage (optional)
STORAGE_S3_DRIVER="s3"
STORAGE_S3_KEY="your-s3-key"
STORAGE_S3_SECRET="your-s3-secret"
STORAGE_S3_BUCKET="your-bucket"
STORAGE_S3_REGION="us-east-1"

# Email
EMAIL_TRANSPORT="sendgrid"
EMAIL_SENDGRID_API_KEY="your-sendgrid-key"
EMAIL_FROM="no-reply@example.com"

# Cache
CACHE_ENABLED="true"
CACHE_STORE="redis"
CACHE_REDIS="redis://localhost:6379"
CACHE_AUTO_PURGE="true"

# Rate Limiting
RATE_LIMITER_ENABLED="true"
RATE_LIMITER_STORE="redis"
RATE_LIMITER_POINTS="100"
RATE_LIMITER_DURATION="60"

# Extensions
EXTENSIONS_AUTO_RELOAD="true"

# Telemetry
TELEMETRY="false"

# AI Integration (custom)
OPENAI_API_KEY="your-openai-key"
ANTHROPIC_API_KEY="your-anthropic-key"
PINECONE_API_KEY="your-pinecone-key"
```

### Step 3: TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "types": ["node", "jest"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@extensions/*": ["extensions/*"],
      "@utils/*": ["src/utils/*"],
      "@services/*": ["src/services/*"],
      "@types/*": ["src/types/*"]
    }
  },
  "include": [
    "src/**/*",
    "extensions/**/*",
    "tests/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "uploads"
  ]
}
```

### Step 4: Extension Development Setup

```bash
# Create extension scaffolding script
cat > scripts/create-extension.sh << 'EOF'
#!/bin/bash

echo "Select extension type:"
echo "1) Endpoint"
echo "2) Hook"
echo "3) Panel"
echo "4) Interface"
echo "5) Display"
echo "6) Layout"
echo "7) Module"
echo "8) Operation"

read -p "Enter choice [1-8]: " choice

read -p "Enter extension name: " name

case $choice in
  1) type="endpoint" ;;
  2) type="hook" ;;
  3) type="panel" ;;
  4) type="interface" ;;
  5) type="display" ;;
  6) type="layout" ;;
  7) type="module" ;;
  8) type="operation" ;;
  *) echo "Invalid choice"; exit 1 ;;
esac

npx create-directus-extension@latest \
  --type=$type \
  --name=$name \
  --language=typescript

echo "Extension created at extensions/$type-$name"
EOF

chmod +x scripts/create-extension.sh
```

## Docker Configuration

### Development Docker Setup

```yaml
# docker-compose.yml
version: '3.8'

services:
  database:
    image: postgis/postgis:15-alpine
    container_name: directus_database
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: directus
      POSTGRES_PASSWORD: directus
      POSTGRES_DB: directus
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U directus"]
      interval: 10s
      timeout: 5s
      retries: 5

  cache:
    image: redis:7-alpine
    container_name: directus_cache
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  directus:
    build:
      context: .
      dockerfile: Dockerfile.dev
    container_name: directus_app
    ports:
      - "8055:8055"
    volumes:
      - ./uploads:/directus/uploads
      - ./extensions:/directus/extensions
      - ./migrations:/directus/migrations
      - ./.env:/directus/.env
    environment:
      DB_CLIENT: pg
      DB_HOST: database
      DB_PORT: 5432
      DB_DATABASE: directus
      DB_USER: directus
      DB_PASSWORD: directus
      CACHE_ENABLED: "true"
      CACHE_STORE: redis
      CACHE_REDIS: redis://cache:6379
      EXTENSIONS_AUTO_RELOAD: "true"
    depends_on:
      database:
        condition: service_healthy
      cache:
        condition: service_healthy
    command: >
      sh -c "
        npx directus database install &&
        npx directus database migrate:latest &&
        npx directus start
      "

  # Development tools
  adminer:
    image: adminer
    container_name: directus_adminer
    ports:
      - "8080:8080"
    environment:
      ADMINER_DEFAULT_SERVER: database
    depends_on:
      - database

  mailhog:
    image: mailhog/mailhog
    container_name: directus_mailhog
    ports:
      - "1025:1025"  # SMTP server
      - "8025:8025"  # Web UI

volumes:
  postgres_data:
  redis_data:

networks:
  default:
    name: directus_network
```

### Production Docker Setup

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY extensions ./extensions
COPY src ./src

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /directus

# Install Directus
RUN npm install -g directus

# Copy built extensions
COPY --from=builder /app/dist/extensions ./extensions
COPY --from=builder /app/package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Create uploads directory
RUN mkdir -p uploads

# Set up healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8055/server/health', (r) => {r.statusCode === 200 ? process.exit(0) : process.exit(1)})"

# Expose port
EXPOSE 8055

# Start Directus
CMD ["npx", "directus", "start"]
```

## Testing Strategy

### Unit Testing with Vitest

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '*.config.ts',
        'tests/',
      ],
    },
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@extensions': path.resolve(__dirname, './extensions'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@services': path.resolve(__dirname, './src/services'),
    },
  },
});
```

```typescript
// tests/setup.ts
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { createTestDatabase, dropTestDatabase } from './helpers/database';
import { mockServices } from './mocks/services';

beforeAll(async () => {
  await createTestDatabase();
  global.testServices = mockServices();
});

afterAll(async () => {
  await dropTestDatabase();
});

beforeEach(() => {
  // Reset mocks
  vi.clearAllMocks();
});

afterEach(() => {
  // Clean up test data
});
```

### Integration Testing

```typescript
// tests/integration/api.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { createDirectus, rest, authentication, createItems, readItems } from '@directus/sdk';

describe('API Integration Tests', () => {
  let client: any;

  beforeAll(async () => {
    client = createDirectus('http://localhost:8055')
      .with(authentication())
      .with(rest());

    await client.login('admin@example.com', 'admin');
  });

  describe('Collections API', () => {
    it('should create and read items', async () => {
      // Create item
      const created = await client.request(
        createItems('articles', {
          title: 'Test Article',
          content: 'Test content',
          status: 'published',
        })
      );

      expect(created).toHaveProperty('id');

      // Read items
      const items = await client.request(
        readItems('articles', {
          filter: {
            id: { _eq: created.id },
          },
        })
      );

      expect(items).toHaveLength(1);
      expect(items[0].title).toBe('Test Article');
    });
  });

  describe('Custom Endpoints', () => {
    it('should handle custom analytics endpoint', async () => {
      const response = await fetch('http://localhost:8055/custom/analytics', {
        headers: {
          Authorization: `Bearer ${client.token}`,
        },
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('data');
      expect(data.data).toHaveProperty('daily');
    });
  });
});
```

### End-to-End Testing with Playwright

```typescript
// tests/e2e/admin-panel.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Directus Admin Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8055/admin');

    // Login
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/content');
  });

  test('should create new article', async ({ page }) => {
    // Navigate to articles
    await page.click('text=Articles');

    // Create new item
    await page.click('button:has-text("Create Item")');

    // Fill form
    await page.fill('input[name="title"]', 'Test Article from E2E');
    await page.fill('textarea[name="content"]', 'This is test content');

    // Save
    await page.click('button:has-text("Save")');

    // Verify
    await expect(page.locator('text=Item created')).toBeVisible();
  });

  test('should use custom panel', async ({ page }) => {
    // Navigate to insights
    await page.click('text=Insights');

    // Check custom panel
    await expect(page.locator('.analytics-panel')).toBeVisible();

    // Verify data loads
    await expect(page.locator('.metric-card')).toHaveCount(3);
  });
});
```

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  release:
    types: [created]

env:
  NODE_VERSION: '18'
  DOCKER_REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # Linting and Type Checking
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Type check
        run: npm run type-check

  # Unit and Integration Tests
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: directus
          POSTGRES_PASSWORD: directus
          POSTGRES_DB: directus_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run migrations
        env:
          DB_CLIENT: pg
          DB_HOST: localhost
          DB_PORT: 5432
          DB_DATABASE: directus_test
          DB_USER: directus
          DB_PASSWORD: directus
        run: |
          npx directus database install
          npx directus database migrate:latest

      - name: Run tests
        run: npm test -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
          flags: unittests
          name: codecov-umbrella

  # E2E Tests
  e2e:
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: |
          npm ci
          npx playwright install --with-deps

      - name: Start services
        run: docker-compose up -d

      - name: Wait for services
        run: |
          timeout 60 sh -c 'until curl -f http://localhost:8055/server/health; do sleep 1; done'

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/

  # Security Scanning
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Snyk Security Scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

      - name: Run npm audit
        run: npm audit --audit-level=high

  # Build and Push Docker Image
  build:
    needs: [lint, test]
    runs-on: ubuntu-latest
    if: github.event_name == 'push' || github.event_name == 'release'
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.DOCKER_REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.DOCKER_REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          platforms: linux/amd64,linux/arm64

  # Deploy to Staging
  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    environment:
      name: staging
      url: https://staging.example.com
    steps:
      - name: Deploy to Kubernetes
        run: |
          echo "Deploying to staging..."
          # kubectl apply -f k8s/staging/

      - name: Run smoke tests
        run: |
          curl -f https://staging.example.com/server/health

  # Deploy to Production
  deploy-production:
    needs: build
    runs-on: ubuntu-latest
    if: github.event_name == 'release'
    environment:
      name: production
      url: https://example.com
    steps:
      - name: Deploy to Kubernetes
        run: |
          echo "Deploying to production..."
          # kubectl apply -f k8s/production/

      - name: Run smoke tests
        run: |
          curl -f https://example.com/server/health

      - name: Notify deployment
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Production deployment completed!'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

## Database Migration Management

### Migration Scripts

```typescript
// migrations/001_create_custom_tables.ts
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create custom analytics table
  await knex.schema.createTable('custom_analytics', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('event_type', 50).notNullable();
    table.string('event_category', 50);
    table.jsonb('event_data');
    table.uuid('user_id').references('id').inTable('directus_users');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.index(['event_type', 'created_at']);
    table.index('user_id');
  });

  // Create custom settings table
  await knex.schema.createTable('custom_settings', (table) => {
    table.string('key', 100).primary();
    table.jsonb('value').notNullable();
    table.string('type', 20).defaultTo('string');
    table.text('description');
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('custom_settings');
  await knex.schema.dropTableIfExists('custom_analytics');
}
```

### Migration Runner Script

```typescript
// scripts/migrate.ts
import { Knex } from 'knex';
import { config } from 'dotenv';
import path from 'path';

config();

const knexConfig: Knex.Config = {
  client: process.env.DB_CLIENT || 'pg',
  connection: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },
  migrations: {
    directory: path.join(__dirname, '../migrations'),
    extension: 'ts',
    tableName: 'knex_migrations',
  },
};

const knex = require('knex')(knexConfig);

async function runMigrations() {
  try {
    console.log('Running migrations...');

    const [batch, migrations] = await knex.migrate.latest();

    if (migrations.length === 0) {
      console.log('Database is already up to date');
    } else {
      console.log(`Batch ${batch} run: ${migrations.length} migrations`);
      migrations.forEach(migration => {
        console.log(`  - ${migration}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

async function rollbackMigrations() {
  try {
    console.log('Rolling back migrations...');

    const [batch, migrations] = await knex.migrate.rollback();

    if (migrations.length === 0) {
      console.log('No migrations to rollback');
    } else {
      console.log(`Batch ${batch} rolled back: ${migrations.length} migrations`);
      migrations.forEach(migration => {
        console.log(`  - ${migration}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('Rollback failed:', error);
    process.exit(1);
  }
}

// Parse command line arguments
const command = process.argv[2];

switch (command) {
  case 'up':
  case 'latest':
    runMigrations();
    break;
  case 'down':
  case 'rollback':
    rollbackMigrations();
    break;
  default:
    console.log('Usage: npm run migrate [up|down]');
    process.exit(1);
}
```

## Development Tools Setup

### VS Code Configuration

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact",
    "vue"
  ],
  "files.exclude": {
    "node_modules": true,
    "dist": true,
    ".turbo": true,
    "uploads": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/uploads": true
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[vue]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "directus.api.url": "http://localhost:8055",
  "directus.api.staticToken": "${env:DIRECTUS_STATIC_TOKEN}"
}
```

### VS Code Launch Configuration

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Directus",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/node_modules/.bin/directus",
      "args": ["start"],
      "env": {
        "NODE_ENV": "development",
        "EXTENSIONS_AUTO_RELOAD": "true"
      },
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Extension",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/extensions/${input:extensionName}/src/index.ts",
      "preLaunchTask": "npm: build:extensions",
      "outFiles": ["${workspaceFolder}/extensions/${input:extensionName}/dist/**/*.js"],
      "env": {
        "NODE_ENV": "development"
      }
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Tests",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/node_modules/.bin/vitest",
      "args": ["--run", "${file}"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ],
  "inputs": [
    {
      "id": "extensionName",
      "type": "promptString",
      "description": "Enter the extension name to debug"
    }
  ]
}
```

## Performance Monitoring

### Application Performance Monitoring

```typescript
// src/monitoring/apm.ts
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';
import { performance } from 'perf_hooks';

export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  constructor() {
    // Initialize Sentry
    if (process.env.SENTRY_DSN) {
      Sentry.init({
        dsn: process.env.SENTRY_DSN,
        integrations: [
          new ProfilingIntegration(),
        ],
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        profilesSampleRate: 1.0,
      });
    }
  }

  startTimer(operation: string): () => void {
    const start = performance.now();

    return () => {
      const duration = performance.now() - start;
      this.recordMetric(operation, duration);

      // Log slow operations
      if (duration > 1000) {
        console.warn(`Slow operation: ${operation} took ${duration.toFixed(2)}ms`);
      }
    };
  }

  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const values = this.metrics.get(name)!;
    values.push(value);

    // Keep only last 100 values
    if (values.length > 100) {
      values.shift();
    }
  }

  getStats(name: string): {
    avg: number;
    min: number;
    max: number;
    p95: number;
  } | null {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);

    return {
      avg: sum / sorted.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p95: sorted[Math.floor(sorted.length * 0.95)],
    };
  }

  async measureDatabaseQuery<T>(
    queryName: string,
    query: () => Promise<T>
  ): Promise<T> {
    const transaction = Sentry.startTransaction({
      op: 'db.query',
      name: queryName,
    });

    const endTimer = this.startTimer(`db.${queryName}`);

    try {
      const result = await query();
      transaction.setStatus('ok');
      return result;
    } catch (error) {
      transaction.setStatus('internal_error');
      throw error;
    } finally {
      endTimer();
      transaction.finish();
    }
  }

  reportMetrics(): void {
    const report: any = {};

    this.metrics.forEach((values, name) => {
      report[name] = this.getStats(name);
    });

    console.log('Performance Report:', JSON.stringify(report, null, 2));

    // Send to monitoring service
    if (process.env.MONITORING_ENDPOINT) {
      fetch(process.env.MONITORING_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          metrics: report,
        }),
      }).catch(console.error);
    }
  }
}
```

## Deployment Strategies

### Kubernetes Deployment

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: directus
  namespace: production
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: directus
  template:
    metadata:
      labels:
        app: directus
    spec:
      containers:
      - name: directus
        image: ghcr.io/myorg/directus:latest
        ports:
        - containerPort: 8055
        env:
        - name: DB_CLIENT
          value: "pg"
        - name: DB_HOST
          valueFrom:
            secretKeyRef:
              name: directus-secrets
              key: db-host
        - name: DB_DATABASE
          value: "directus"
        - name: DB_USER
          valueFrom:
            secretKeyRef:
              name: directus-secrets
              key: db-user
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: directus-secrets
              key: db-password
        - name: KEY
          valueFrom:
            secretKeyRef:
              name: directus-secrets
              key: app-key
        - name: SECRET
          valueFrom:
            secretKeyRef:
              name: directus-secrets
              key: app-secret
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /server/health
            port: 8055
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /server/ping
            port: 8055
          initialDelaySeconds: 10
          periodSeconds: 5
        volumeMounts:
        - name: uploads
          mountPath: /directus/uploads
        - name: extensions
          mountPath: /directus/extensions
      volumes:
      - name: uploads
        persistentVolumeClaim:
          claimName: directus-uploads
      - name: extensions
        configMap:
          name: directus-extensions

---
apiVersion: v1
kind: Service
metadata:
  name: directus
  namespace: production
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 8055
  selector:
    app: directus

---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: directus-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: directus
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Terraform Infrastructure

```hcl
# terraform/main.tf
terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket = "terraform-state-directus"
    key    = "production/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
}

# RDS Database
resource "aws_db_instance" "directus" {
  identifier     = "directus-production"
  engine         = "postgres"
  engine_version = "15.3"
  instance_class = "db.t3.medium"

  allocated_storage     = 100
  storage_type          = "gp3"
  storage_encrypted     = true

  db_name  = "directus"
  username = var.db_username
  password = var.db_password

  vpc_security_group_ids = [aws_security_group.database.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  backup_retention_period = 30
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  skip_final_snapshot = false
  final_snapshot_identifier = "directus-final-snapshot-${timestamp()}"

  tags = {
    Name        = "directus-production"
    Environment = "production"
  }
}

# ElastiCache Redis
resource "aws_elasticache_cluster" "directus" {
  cluster_id           = "directus-cache"
  engine              = "redis"
  node_type           = "cache.t3.micro"
  num_cache_nodes     = 1
  parameter_group_name = "default.redis7"
  port                = 6379

  subnet_group_name = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.cache.id]

  tags = {
    Name        = "directus-cache"
    Environment = "production"
  }
}

# S3 Bucket for uploads
resource "aws_s3_bucket" "uploads" {
  bucket = "directus-uploads-${var.environment}"

  tags = {
    Name        = "directus-uploads"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_versioning" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "directus-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name        = "directus-cluster"
    Environment = var.environment
  }
}

# ECS Task Definition
resource "aws_ecs_task_definition" "directus" {
  family                   = "directus"
  network_mode            = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                     = "1024"
  memory                  = "2048"

  container_definitions = jsonencode([{
    name  = "directus"
    image = "${var.ecr_repository_url}:${var.image_tag}"

    portMappings = [{
      containerPort = 8055
      protocol      = "tcp"
    }]

    environment = [
      {
        name  = "DB_CLIENT"
        value = "pg"
      },
      {
        name  = "DB_HOST"
        value = aws_db_instance.directus.address
      },
      {
        name  = "DB_DATABASE"
        value = "directus"
      },
      {
        name  = "CACHE_ENABLED"
        value = "true"
      },
      {
        name  = "CACHE_STORE"
        value = "redis"
      },
      {
        name  = "CACHE_REDIS"
        value = "redis://${aws_elasticache_cluster.directus.cache_nodes[0].address}:6379"
      },
      {
        name  = "STORAGE_LOCATIONS"
        value = "s3"
      },
      {
        name  = "STORAGE_S3_BUCKET"
        value = aws_s3_bucket.uploads.id
      }
    ]

    secrets = [
      {
        name      = "DB_USER"
        valueFrom = aws_secretsmanager_secret.db_credentials.arn
      },
      {
        name      = "DB_PASSWORD"
        valueFrom = aws_secretsmanager_secret.db_credentials.arn
      },
      {
        name      = "KEY"
        valueFrom = aws_secretsmanager_secret.app_secrets.arn
      },
      {
        name      = "SECRET"
        valueFrom = aws_secretsmanager_secret.app_secrets.arn
      }
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.directus.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "directus"
      }
    }
  }])

  tags = {
    Name        = "directus-task"
    Environment = var.environment
  }
}

# Output values
output "database_endpoint" {
  value       = aws_db_instance.directus.endpoint
  description = "RDS database endpoint"
}

output "cache_endpoint" {
  value       = aws_elasticache_cluster.directus.cache_nodes[0].address
  description = "Redis cache endpoint"
}

output "s3_bucket" {
  value       = aws_s3_bucket.uploads.id
  description = "S3 bucket for uploads"
}
```

## Monitoring & Logging

### Structured Logging

```typescript
// src/utils/logger.ts
import winston from 'winston';
import { LoggingWinston } from '@google-cloud/logging-winston';

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }),
];

// Add cloud logging in production
if (process.env.NODE_ENV === 'production') {
  if (process.env.GOOGLE_CLOUD_PROJECT) {
    transports.push(new LoggingWinston());
  }
}

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'directus',
    environment: process.env.NODE_ENV,
  },
  transports,
});

// Request logging middleware
export function requestLogger(req: any, res: any, next: any) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;

    logger.info('HTTP Request', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId: req.accountability?.user,
    });
  });

  next();
}
```

## Best Practices

### Code Quality Standards

```typescript
// .eslintrc.js
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: [
    '@typescript-eslint',
    'import',
    'prettier',
    'security',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'plugin:security/recommended',
    'prettier',
  ],
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/strict-boolean-expressions': 'error',
    'import/order': ['error', {
      'groups': ['builtin', 'external', 'internal'],
      'newlines-between': 'always',
      'alphabetize': { 'order': 'asc' },
    }],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'security/detect-object-injection': 'warn',
  },
  ignorePatterns: ['dist/', 'node_modules/', 'coverage/'],
};
```

### Security Best Practices

```typescript
// src/security/security-middleware.ts
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import { v4 as uuidv4 } from 'uuid';

export function setupSecurity(app: any): void {
  // Security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP',
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use('/api/', limiter);

  // Stricter rate limiting for auth endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    skipSuccessfulRequests: true,
  });

  app.use('/auth/', authLimiter);

  // Request sanitization
  app.use(mongoSanitize());

  // Request ID for tracing
  app.use((req: any, res: any, next: any) => {
    req.id = req.headers['x-request-id'] || uuidv4();
    res.setHeader('X-Request-ID', req.id);
    next();
  });

  // CORS configuration
  app.use((req: any, res: any, next: any) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
    const origin = req.headers.origin;

    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }

    next();
  });
}
```

## Success Metrics

- ✅ Development environment setup < 5 minutes
- ✅ TypeScript compilation with zero errors
- ✅ Test coverage > 80%
- ✅ CI/CD pipeline execution < 10 minutes
- ✅ Docker build size < 500MB
- ✅ Zero-downtime deployments
- ✅ Database migrations rollback capability
- ✅ Monitoring alerts < 1 minute response time
- ✅ Security scanning passes all checks
- ✅ Performance benchmarks meet SLA requirements

## Resources

- [Directus Documentation](https://docs.directus.io)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest)
- [Vitest Testing Framework](https://vitest.dev/)
- [Playwright E2E Testing](https://playwright.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## Version History

- **1.0.0** - Initial release with comprehensive development workflow patterns