---
name: "Directus Backend Architecture"
description: "Master Directus backend internals: API extensions, hooks, flows, services, and database operations"
version: 1.0.0
author: "Directus Development System"
tags: ["directus", "backend", "api", "hooks", "flows", "typescript", "node", "database"]
---

# Directus Backend Architecture

## Overview

This skill provides deep expertise in Directus backend architecture, covering API endpoint extensions, hook systems, service layers, flows and automation, database operations, authentication, and performance optimization. Master the TypeScript/Node.js backend to build scalable, secure, and efficient Directus applications.

## When to Use This Skill

- Creating custom API endpoints and routes
- Implementing business logic with hooks
- Building automation workflows with Flows
- Extending authentication and permissions
- Optimizing database queries and performance
- Creating custom services and providers
- Implementing real-time features
- Building data migration and seeding scripts
- Integrating third-party services

## Core Architecture

### Directus Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: Knex.js query builder
- **ORM**: Custom abstraction layer
- **Cache**: Redis/Memory
- **Queue**: Bull/Redis
- **WebSockets**: Socket.io

### Directory Structure

```
directus/
├── api/                  # Core API implementation
│   ├── src/
│   │   ├── services/     # Business logic layer
│   │   ├── controllers/  # Request handlers
│   │   ├── middleware/   # Express middleware
│   │   ├── database/     # Database abstraction
│   │   ├── utils/        # Helper functions
│   │   └── types/        # TypeScript definitions
├── extensions/
│   ├── endpoints/        # Custom API endpoints
│   ├── hooks/            # Event hooks
│   ├── operations/       # Flow operations
│   └── services/         # Custom services
└── shared/               # Shared utilities
```

## Process: Creating Custom API Endpoints

### Step 1: Initialize Endpoint Extension

```bash
npx create-directus-extension@latest

# Select:
# > endpoint
# > my-custom-api
# > typescript
```

### Step 2: Implement Endpoint Logic

```typescript
// src/index.ts
import { defineEndpoint } from '@directus/extensions-sdk';
import { Router } from 'express';
import Joi from 'joi';

export default defineEndpoint((router, context) => {
  const { services, database, getSchema, env, logger, emitter } = context;
  const { ItemsService, MailService, AssetsService } = services;

  // Input validation schema
  const createSchema = Joi.object({
    title: Joi.string().required().min(3).max(255),
    content: Joi.string().required(),
    status: Joi.string().valid('draft', 'published').default('draft'),
    tags: Joi.array().items(Joi.string()),
    metadata: Joi.object(),
  });

  // GET /custom/analytics
  router.get('/analytics', async (req, res, next) => {
    try {
      // Check authentication
      if (!req.accountability?.user) {
        return res.status(401).json({
          error: 'Unauthorized',
        });
      }

      const schema = await getSchema();

      // Use Knex directly for complex queries
      const results = await database
        .select(
          database.raw('DATE(created_at) as date'),
          database.raw('COUNT(*) as count'),
          database.raw('AVG(amount) as avg_amount')
        )
        .from('orders')
        .where('status', 'completed')
        .whereRaw('created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)')
        .groupBy(database.raw('DATE(created_at)'))
        .orderBy('date', 'desc');

      // Transform results
      const analytics = {
        daily: results,
        total: results.reduce((sum, day) => sum + day.count, 0),
        average: results.reduce((sum, day) => sum + day.avg_amount, 0) / results.length,
        period: '30_days',
      };

      return res.json({
        data: analytics,
      });
    } catch (error) {
      logger.error('Analytics endpoint error:', error);
      return next(error);
    }
  });

  // POST /custom/process
  router.post('/process', async (req, res, next) => {
    try {
      // Validate input
      const { error, value } = createSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Validation Error',
          details: error.details,
        });
      }

      // Create items service with user context
      const itemsService = new ItemsService('articles', {
        schema: await getSchema(),
        accountability: req.accountability,
      });

      // Business logic transaction
      const result = await database.transaction(async (trx) => {
        // Create main item
        const article = await itemsService.createOne({
          ...value,
          author: req.accountability?.user,
        }, { emitEvents: false });

        // Create related items
        if (value.tags && value.tags.length > 0) {
          const tagsService = new ItemsService('article_tags', {
            schema: await getSchema(),
            accountability: req.accountability,
            knex: trx,
          });

          await tagsService.createMany(
            value.tags.map(tag => ({
              article_id: article.id,
              tag_name: tag,
            }))
          );
        }

        // Emit custom event
        emitter.emitAction('custom.article.created', {
          article,
          user: req.accountability?.user,
        });

        return article;
      });

      // Send notification email
      if (env.EMAIL_NOTIFICATIONS === 'true') {
        const mailService = new MailService({ schema: await getSchema() });
        await mailService.send({
          to: env.ADMIN_EMAIL,
          subject: `New Article: ${result.title}`,
          html: `
            <h2>New Article Published</h2>
            <p><strong>Title:</strong> ${result.title}</p>
            <p><strong>Author:</strong> ${req.accountability?.user}</p>
            <p><strong>Status:</strong> ${result.status}</p>
          `,
        });
      }

      return res.status(201).json({
        data: result,
      });
    } catch (error) {
      logger.error('Process endpoint error:', error);
      return next(error);
    }
  });

  // DELETE /custom/cleanup
  router.delete('/cleanup/:days', async (req, res, next) => {
    try {
      // Check admin permission
      if (req.accountability?.role !== 'admin') {
        return res.status(403).json({
          error: 'Forbidden',
        });
      }

      const days = parseInt(req.params.days, 10);

      if (isNaN(days) || days < 1) {
        return res.status(400).json({
          error: 'Invalid days parameter',
        });
      }

      // Perform cleanup
      const deleted = await database('logs')
        .where('created_at', '<', database.raw(`DATE_SUB(NOW(), INTERVAL ? DAY)`, [days]))
        .delete();

      logger.info(`Cleaned up ${deleted} old log entries`);

      return res.json({
        data: {
          deleted,
          message: `Removed ${deleted} log entries older than ${days} days`,
        },
      });
    } catch (error) {
      logger.error('Cleanup endpoint error:', error);
      return next(error);
    }
  });

  // WebSocket endpoint
  router.get('/stream', (req, res) => {
    // Server-Sent Events for real-time updates
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    // Send initial connection
    res.write('data: {"type":"connected"}\n\n');

    // Listen for events
    const handler = (data: any) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    emitter.onAction('items.create', handler);
    emitter.onAction('items.update', handler);

    // Cleanup on disconnect
    req.on('close', () => {
      emitter.offAction('items.create', handler);
      emitter.offAction('items.update', handler);
    });
  });
});
```

## Process: Implementing Hooks

### Hook Types

1. **Filter Hooks** - Modify data before database operations
2. **Action Hooks** - React to events after they occur
3. **Init Hooks** - Run during startup
4. **Schedule Hooks** - Run on cron schedules

### Step 1: Create Hook Extension

```typescript
// src/index.ts
import { defineHook } from '@directus/extensions-sdk';
import { createHash } from 'crypto';
import axios from 'axios';

export default defineHook(({ filter, action, init, schedule }, context) => {
  const { services, database, getSchema, env, logger } = context;
  const { ItemsService, ActivityService } = services;

  // Filter hook - runs before database operations
  filter('items.create', async (payload, meta, context) => {
    // Auto-generate slugs for articles
    if (meta.collection === 'articles') {
      if (!payload.slug && payload.title) {
        payload.slug = generateSlug(payload.title);
      }

      // Add metadata
      payload.word_count = countWords(payload.content || '');
      payload.reading_time = Math.ceil(payload.word_count / 200);

      // Generate excerpt if not provided
      if (!payload.excerpt && payload.content) {
        payload.excerpt = generateExcerpt(payload.content, 160);
      }

      // Validate uniqueness
      const schema = await getSchema();
      const articlesService = new ItemsService('articles', {
        schema,
        knex: database,
      });

      const existing = await articlesService.readByQuery({
        filter: { slug: { _eq: payload.slug } },
        limit: 1,
      });

      if (existing.length > 0) {
        payload.slug = `${payload.slug}-${Date.now()}`;
      }
    }

    return payload;
  });

  // Action hook - runs after database operations
  action('items.create', async ({ payload, key, collection }, context) => {
    try {
      if (collection === 'orders') {
        // Send to external API
        if (env.EXTERNAL_API_URL) {
          await axios.post(`${env.EXTERNAL_API_URL}/webhook/order`, {
            order_id: key,
            ...payload,
          }, {
            headers: {
              'X-API-Key': env.EXTERNAL_API_KEY,
            },
          });
        }

        // Create audit log
        const schema = await getSchema();
        const activityService = new ActivityService({
          schema,
          accountability: context.accountability,
        });

        await activityService.createOne({
          action: 'create',
          collection: 'orders',
          item: key,
          comment: `Order #${key} created with total: ${payload.total}`,
        });

        // Update statistics
        await updateStatistics('orders', 'created');
      }
    } catch (error) {
      logger.error('Order creation hook error:', error);
      // Don't throw - let the main operation succeed
    }
  });

  // Filter hook for updates
  filter('items.update', async (payload, meta, context) => {
    const { collection, keys } = meta;

    if (collection === 'users') {
      // Hash sensitive data
      if (payload.password) {
        payload.password = await hashPassword(payload.password);
      }

      // Track changes
      payload.last_modified = new Date().toISOString();
      payload.modified_by = context.accountability?.user;

      // Validate email changes
      if (payload.email) {
        const isValid = validateEmail(payload.email);
        if (!isValid) {
          throw new Error('Invalid email format');
        }
      }
    }

    return payload;
  });

  // Action hook for deletions
  action('items.delete', async ({ collection, payload }, context) => {
    if (collection === 'files') {
      // Clean up associated resources
      for (const fileId of payload) {
        await cleanupFileResources(fileId);
      }

      // Log deletion
      logger.info(`Files deleted: ${payload.join(', ')}`);
    }
  });

  // Init hook - runs on startup
  init('app.before', async () => {
    logger.info('Initializing custom hooks...');

    // Verify database tables
    await verifyCustomTables();

    // Load configuration
    await loadConfiguration();

    // Register custom validators
    registerValidators();

    logger.info('Custom hooks initialized successfully');
  });

  // Schedule hook - runs on cron schedule
  schedule('0 0 * * *', async () => {
    // Daily cleanup task
    logger.info('Running daily cleanup...');

    const schema = await getSchema();

    // Clean expired sessions
    const deleted = await database('directus_sessions')
      .where('expires', '<', new Date())
      .delete();

    logger.info(`Cleaned ${deleted} expired sessions`);

    // Generate daily report
    await generateDailyReport(schema);

    // Update search index
    await updateSearchIndex();
  });

  // Schedule hook - every 5 minutes
  schedule('*/5 * * * *', async () => {
    // Check system health
    const health = await checkSystemHealth();

    if (!health.healthy) {
      logger.error('System health check failed:', health.issues);

      // Send alert
      await sendHealthAlert(health);
    }
  });

  // Helper functions
  function generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function countWords(text: string): number {
    return text.trim().split(/\s+/).length;
  }

  function generateExcerpt(content: string, maxLength: number): string {
    const stripped = content.replace(/<[^>]*>/g, '');
    if (stripped.length <= maxLength) return stripped;
    return stripped.substring(0, maxLength).trim() + '...';
  }

  async function hashPassword(password: string): Promise<string> {
    const hash = createHash('sha256');
    hash.update(password + env.KEY);
    return hash.digest('hex');
  }

  function validateEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  async function cleanupFileResources(fileId: string): Promise<void> {
    // Clean thumbnails
    await database('directus_files')
      .where('folder', fileId)
      .delete();

    // Clean CDN cache
    if (env.CDN_URL) {
      await axios.delete(`${env.CDN_URL}/purge/${fileId}`);
    }
  }

  async function verifyCustomTables(): Promise<void> {
    const requiredTables = ['custom_logs', 'custom_statistics'];

    for (const table of requiredTables) {
      const exists = await database.schema.hasTable(table);

      if (!exists) {
        logger.warn(`Creating missing table: ${table}`);

        await database.schema.createTable(table, (t) => {
          t.uuid('id').primary();
          t.jsonb('data');
          t.timestamps(true, true);
        });
      }
    }
  }

  async function updateStatistics(type: string, action: string): Promise<void> {
    await database('custom_statistics')
      .insert({
        id: database.raw('gen_random_uuid()'),
        type,
        action,
        count: 1,
        date: new Date(),
      })
      .onConflict(['type', 'action', database.raw('DATE(date)')])
      .merge({
        count: database.raw('custom_statistics.count + 1'),
      });
  }

  async function checkSystemHealth(): Promise<any> {
    const health = {
      healthy: true,
      issues: [],
      metrics: {},
    };

    // Check database connection
    try {
      await database.raw('SELECT 1');
      health.metrics.database = 'connected';
    } catch (error) {
      health.healthy = false;
      health.issues.push('Database connection failed');
    }

    // Check memory usage
    const memUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    health.metrics.memory = `${heapUsedMB}MB`;

    if (heapUsedMB > 512) {
      health.healthy = false;
      health.issues.push(`High memory usage: ${heapUsedMB}MB`);
    }

    return health;
  }
});
```

## Process: Building Flows and Operations

### Step 1: Create Custom Operation

```typescript
// src/index.ts
import { defineOperationApi } from '@directus/extensions-sdk';

type Options = {
  collection: string;
  batchSize: number;
  operation: 'archive' | 'delete' | 'export';
  conditions: Record<string, any>;
};

export default defineOperationApi<Options>({
  id: 'batch-processor',
  handler: async ({ collection, batchSize, operation, conditions }, context) => {
    const { services, database, getSchema, logger, data } = context;
    const { ItemsService } = services;

    const schema = await getSchema();
    const itemsService = new ItemsService(collection, {
      schema,
      accountability: {
        role: 'admin', // Use admin context for operations
      },
    });

    let processed = 0;
    let hasMore = true;
    const results = [];

    while (hasMore) {
      // Fetch batch
      const items = await itemsService.readByQuery({
        filter: conditions,
        limit: batchSize,
        offset: processed,
      });

      if (items.length === 0) {
        hasMore = false;
        break;
      }

      // Process batch based on operation
      for (const item of items) {
        try {
          switch (operation) {
            case 'archive':
              await itemsService.updateOne(item.id, {
                status: 'archived',
                archived_at: new Date(),
              });
              results.push({ id: item.id, status: 'archived' });
              break;

            case 'delete':
              await itemsService.deleteOne(item.id);
              results.push({ id: item.id, status: 'deleted' });
              break;

            case 'export':
              // Transform and prepare for export
              const exportData = transformForExport(item);
              results.push(exportData);
              break;
          }

          processed++;
        } catch (error) {
          logger.error(`Failed to process item ${item.id}:`, error);
          results.push({ id: item.id, status: 'error', error: error.message });
        }
      }

      // Check if we've processed all items
      if (items.length < batchSize) {
        hasMore = false;
      }

      // Add delay to prevent overload
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return {
      processed,
      results,
      summary: {
        total: processed,
        successful: results.filter(r => r.status !== 'error').length,
        failed: results.filter(r => r.status === 'error').length,
      },
    };
  },
});

function transformForExport(item: any): any {
  return {
    id: item.id,
    title: item.title || 'Untitled',
    created: new Date(item.created_at).toISOString(),
    data: JSON.stringify(item),
  };
}
```

### Step 2: Create Flow Configuration

```typescript
// src/flow-app.ts
import { defineOperationApp } from '@directus/extensions-sdk';

export default defineOperationApp({
  id: 'batch-processor',
  name: 'Batch Processor',
  icon: 'library_books',
  description: 'Process items in batches with various operations',
  overview: ({ collection, operation, batchSize }) => [
    {
      label: 'Collection',
      text: collection,
    },
    {
      label: 'Operation',
      text: operation,
    },
    {
      label: 'Batch Size',
      text: String(batchSize),
    },
  ],
  options: [
    {
      field: 'collection',
      name: 'Collection',
      type: 'string',
      meta: {
        width: 'half',
        interface: 'system-collection',
      },
    },
    {
      field: 'operation',
      name: 'Operation',
      type: 'string',
      meta: {
        width: 'half',
        interface: 'select-dropdown',
        options: {
          choices: [
            { text: 'Archive', value: 'archive' },
            { text: 'Delete', value: 'delete' },
            { text: 'Export', value: 'export' },
          ],
        },
      },
    },
    {
      field: 'batchSize',
      name: 'Batch Size',
      type: 'integer',
      meta: {
        width: 'half',
        interface: 'input',
      },
      schema: {
        default_value: 100,
      },
    },
    {
      field: 'conditions',
      name: 'Filter Conditions',
      type: 'json',
      meta: {
        width: 'full',
        interface: 'input-code',
        options: {
          language: 'json',
        },
      },
    },
  ],
});
```

## Service Layer Architecture

### Custom Service Implementation

```typescript
// src/services/analytics.service.ts
import { BaseService } from '@directus/api/services';
import { Knex } from 'knex';

export class AnalyticsService extends BaseService {
  private knex: Knex;
  private tableName = 'analytics_events';

  constructor(options: any) {
    super(options);
    this.knex = options.knex || options.database;
  }

  async trackEvent(event: {
    category: string;
    action: string;
    label?: string;
    value?: number;
    userId?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    await this.knex(this.tableName).insert({
      id: this.knex.raw('gen_random_uuid()'),
      category: event.category,
      action: event.action,
      label: event.label,
      value: event.value,
      user_id: event.userId,
      metadata: JSON.stringify(event.metadata || {}),
      created_at: new Date(),
      session_id: this.accountability?.session,
      ip_address: this.accountability?.ip,
    });

    // Update aggregates
    await this.updateAggregates(event);
  }

  async getMetrics(options: {
    startDate: Date;
    endDate: Date;
    groupBy: 'hour' | 'day' | 'week' | 'month';
    category?: string;
  }): Promise<any[]> {
    const query = this.knex(this.tableName)
      .select(
        this.knex.raw(`DATE_TRUNC('${options.groupBy}', created_at) as period`),
        'category',
        'action',
        this.knex.raw('COUNT(*) as count'),
        this.knex.raw('COUNT(DISTINCT user_id) as unique_users'),
        this.knex.raw('AVG(value) as avg_value')
      )
      .whereBetween('created_at', [options.startDate, options.endDate])
      .groupBy('period', 'category', 'action')
      .orderBy('period', 'desc');

    if (options.category) {
      query.where('category', options.category);
    }

    return await query;
  }

  async getUserJourney(userId: string): Promise<any[]> {
    return await this.knex(this.tableName)
      .where('user_id', userId)
      .orderBy('created_at', 'asc')
      .select('category', 'action', 'label', 'created_at', 'metadata');
  }

  async getFunnelAnalysis(steps: string[]): Promise<any> {
    const results = {};

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const query = this.knex(this.tableName)
        .countDistinct('user_id as users')
        .where('action', step);

      if (i > 0) {
        // Only count users who completed previous steps
        query.whereIn('user_id', function() {
          this.select('user_id')
            .from('analytics_events')
            .where('action', steps[i - 1]);
        });
      }

      const result = await query.first();
      results[step] = result.users;
    }

    return results;
  }

  async getCohortAnalysis(cohortDate: Date): Promise<any> {
    const cohortQuery = `
      WITH cohort_users AS (
        SELECT DISTINCT user_id
        FROM ${this.tableName}
        WHERE DATE(created_at) = DATE(?)
      ),
      retention_data AS (
        SELECT
          DATE_PART('day', ae.created_at - ?) as days_since_cohort,
          COUNT(DISTINCT ae.user_id) as retained_users
        FROM ${this.tableName} ae
        INNER JOIN cohort_users cu ON ae.user_id = cu.user_id
        WHERE ae.created_at >= ?
        GROUP BY days_since_cohort
      )
      SELECT * FROM retention_data
      ORDER BY days_since_cohort
    `;

    return await this.knex.raw(cohortQuery, [cohortDate, cohortDate, cohortDate]);
  }

  private async updateAggregates(event: any): Promise<void> {
    const date = new Date().toISOString().split('T')[0];

    await this.knex('analytics_aggregates')
      .insert({
        id: this.knex.raw('gen_random_uuid()'),
        date,
        category: event.category,
        action: event.action,
        count: 1,
        sum_value: event.value || 0,
      })
      .onConflict(['date', 'category', 'action'])
      .merge({
        count: this.knex.raw('analytics_aggregates.count + 1'),
        sum_value: this.knex.raw('analytics_aggregates.sum_value + ?', [event.value || 0]),
      });
  }

  async cleanupOldEvents(daysToKeep: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    return await this.knex(this.tableName)
      .where('created_at', '<', cutoffDate)
      .delete();
  }
}
```

## Database Operations

### Advanced Query Patterns

```typescript
// Complex database queries
import { Knex } from 'knex';

export class DatabaseOperations {
  constructor(private database: Knex) {}

  // Recursive CTE for hierarchical data
  async getHierarchy(parentId: string | null): Promise<any[]> {
    const query = `
      WITH RECURSIVE category_tree AS (
        -- Anchor: top-level categories
        SELECT id, name, parent_id, 0 as level, ARRAY[id] as path
        FROM categories
        WHERE parent_id ${parentId ? '= ?' : 'IS NULL'}

        UNION ALL

        -- Recursive: child categories
        SELECT c.id, c.name, c.parent_id, ct.level + 1, ct.path || c.id
        FROM categories c
        INNER JOIN category_tree ct ON c.parent_id = ct.id
        WHERE ct.level < 10  -- Prevent infinite recursion
      )
      SELECT * FROM category_tree
      ORDER BY path
    `;

    const bindings = parentId ? [parentId] : [];
    const result = await this.database.raw(query, bindings);
    return result.rows;
  }

  // Window functions for analytics
  async getRunningTotals(startDate: Date, endDate: Date): Promise<any[]> {
    const query = `
      SELECT
        date,
        amount,
        SUM(amount) OVER (ORDER BY date) as running_total,
        AVG(amount) OVER (
          ORDER BY date
          ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
        ) as moving_avg_7d,
        ROW_NUMBER() OVER (ORDER BY amount DESC) as rank_by_amount
      FROM daily_sales
      WHERE date BETWEEN ? AND ?
      ORDER BY date
    `;

    const result = await this.database.raw(query, [startDate, endDate]);
    return result.rows;
  }

  // Full-text search with ranking
  async searchContent(searchTerm: string): Promise<any[]> {
    const query = `
      SELECT
        id,
        title,
        content,
        ts_rank(search_vector, query) as relevance,
        ts_headline(
          'english',
          content,
          query,
          'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=20'
        ) as excerpt
      FROM articles,
        plainto_tsquery('english', ?) as query
      WHERE search_vector @@ query
      ORDER BY relevance DESC
      LIMIT 20
    `;

    const result = await this.database.raw(query, [searchTerm]);
    return result.rows;
  }

  // Batch upsert with conflict resolution
  async batchUpsert(table: string, records: any[]): Promise<void> {
    const chunkSize = 1000;

    for (let i = 0; i < records.length; i += chunkSize) {
      const chunk = records.slice(i, i + chunkSize);

      await this.database(table)
        .insert(chunk)
        .onConflict('id')
        .merge({
          updated_at: this.database.fn.now(),
          // Merge only changed fields
          ...chunk.reduce((acc, record) => {
            Object.keys(record).forEach(key => {
              if (key !== 'id' && key !== 'created_at') {
                acc[key] = this.database.raw('EXCLUDED.' + key);
              }
            });
            return acc;
          }, {}),
        });
    }
  }

  // Optimized pagination with cursor
  async getCursorPagination(options: {
    table: string;
    cursor?: string;
    limit: number;
    orderBy: string;
  }): Promise<{ data: any[]; nextCursor: string | null }> {
    let query = this.database(options.table)
      .orderBy(options.orderBy)
      .limit(options.limit + 1);

    if (options.cursor) {
      const decodedCursor = Buffer.from(options.cursor, 'base64').toString();
      query = query.where(options.orderBy, '>', decodedCursor);
    }

    const results = await query;
    const hasMore = results.length > options.limit;
    const data = hasMore ? results.slice(0, -1) : results;

    const nextCursor = hasMore
      ? Buffer.from(data[data.length - 1][options.orderBy]).toString('base64')
      : null;

    return { data, nextCursor };
  }
}
```

## Authentication & Permissions

### Custom Authentication Provider

```typescript
// src/auth-provider.ts
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { BaseAuthProvider } from '@directus/api/auth';

export class CustomAuthProvider extends BaseAuthProvider {
  async login(credentials: { email: string; password: string }) {
    const user = await this.knex('directus_users')
      .where('email', credentials.email)
      .first();

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const validPassword = await bcrypt.compare(
      credentials.password,
      user.password
    );

    if (!validPassword) {
      // Log failed attempt
      await this.logFailedAttempt(user.id);
      throw new Error('Invalid credentials');
    }

    // Check if account is locked
    if (user.status !== 'active') {
      throw new Error('Account is not active');
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user);

    // Update last login
    await this.knex('directus_users')
      .where('id', user.id)
      .update({
        last_access: new Date(),
        last_page: '/dashboard',
      });

    return {
      accessToken,
      refreshToken,
      user: this.sanitizeUser(user),
    };
  }

  async verify(token: string) {
    try {
      const payload = jwt.verify(token, this.secret) as any;

      // Check if token is still valid in database
      const session = await this.knex('directus_sessions')
        .where('token', token)
        .where('expires', '>', new Date())
        .first();

      if (!session) {
        throw new Error('Session expired');
      }

      return {
        id: payload.id,
        role: payload.role,
        app_access: payload.app_access,
      };
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  private generateAccessToken(user: any): string {
    return jwt.sign(
      {
        id: user.id,
        role: user.role,
        app_access: user.app_access,
        email: user.email,
      },
      this.secret,
      {
        expiresIn: '15m',
        issuer: 'directus',
      }
    );
  }

  private async generateRefreshToken(user: any): Promise<string> {
    const token = this.generateRandomToken();

    await this.knex('directus_sessions').insert({
      token,
      user: user.id,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      ip: this.request?.ip,
      user_agent: this.request?.headers['user-agent'],
    });

    return token;
  }

  private sanitizeUser(user: any): any {
    const { password, ...sanitized } = user;
    return sanitized;
  }
}
```

## Performance Optimization

### Caching Strategy

```typescript
// src/cache/cache.service.ts
import Redis from 'ioredis';
import { LRUCache } from 'lru-cache';

export class CacheService {
  private redis: Redis;
  private memoryCache: LRUCache<string, any>;

  constructor() {
    // Redis for distributed cache
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    });

    // Memory cache for hot data
    this.memoryCache = new LRUCache({
      max: 500,
      ttl: 1000 * 60 * 5, // 5 minutes
    });
  }

  async get(key: string): Promise<any | null> {
    // Check memory cache first
    const memResult = this.memoryCache.get(key);
    if (memResult) return memResult;

    // Check Redis
    const redisResult = await this.redis.get(key);
    if (redisResult) {
      const data = JSON.parse(redisResult);
      // Populate memory cache
      this.memoryCache.set(key, data);
      return data;
    }

    return null;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(value);

    // Set in both caches
    this.memoryCache.set(key, value);

    if (ttl) {
      await this.redis.setex(key, ttl, serialized);
    } else {
      await this.redis.set(key, serialized);
    }
  }

  async invalidate(pattern: string): Promise<void> {
    // Clear from memory cache
    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern)) {
        this.memoryCache.delete(key);
      }
    }

    // Clear from Redis
    const keys = await this.redis.keys(`*${pattern}*`);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  // Cache wrapper for database queries
  async remember<T>(
    key: string,
    ttl: number,
    callback: () => Promise<T>
  ): Promise<T> {
    const cached = await this.get(key);
    if (cached) return cached;

    const fresh = await callback();
    await this.set(key, fresh, ttl);
    return fresh;
  }
}
```

### Query Optimization

```typescript
// src/optimization/query-optimizer.ts
export class QueryOptimizer {
  constructor(private knex: Knex) {}

  // Optimize N+1 queries with dataloader pattern
  async batchLoadRelations<T>(
    items: T[],
    relation: string,
    foreignKey: string
  ): Promise<Map<string, any[]>> {
    const ids = items.map(item => item[foreignKey]);

    const relations = await this.knex(relation)
      .whereIn(foreignKey, ids)
      .select();

    // Group by foreign key
    const grouped = new Map<string, any[]>();
    for (const rel of relations) {
      const key = rel[foreignKey];
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(rel);
    }

    return grouped;
  }

  // Index hints for specific queries
  async optimizedSearch(table: string, conditions: any): Promise<any[]> {
    return await this.knex.raw(`
      SELECT /*+ INDEX(${table} idx_search) */ *
      FROM ${table}
      WHERE ?
      ORDER BY created_at DESC
      LIMIT 100
    `, [conditions]);
  }

  // Query result streaming for large datasets
  streamLargeDataset(table: string, batchSize: number = 1000) {
    return this.knex(table)
      .select()
      .stream({ highWaterMark: batchSize });
  }

  // Explain query execution plan
  async explainQuery(query: Knex.QueryBuilder): Promise<any> {
    const sql = query.toSQL();
    const result = await this.knex.raw(`EXPLAIN ANALYZE ${sql.sql}`, sql.bindings);
    return result.rows;
  }
}
```

## Testing Strategies

### Integration Tests

```typescript
// test/endpoints.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createDirectus } from '@directus/sdk';

describe('Custom Endpoints', () => {
  let app;
  let authToken;

  beforeAll(async () => {
    app = await createTestApp();
    authToken = await getAuthToken();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('POST /custom/process', () => {
    it('should create article with valid data', async () => {
      const response = await request(app)
        .post('/custom/process')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Article',
          content: 'Test content',
          status: 'draft',
          tags: ['test', 'api'],
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.title).toBe('Test Article');
    });

    it('should validate input data', async () => {
      const response = await request(app)
        .post('/custom/process')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // Missing required fields
          status: 'invalid',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation Error');
    });

    it('should handle unauthorized requests', async () => {
      const response = await request(app)
        .post('/custom/process')
        .send({ title: 'Test' });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /custom/analytics', () => {
    it('should return analytics data', async () => {
      const response = await request(app)
        .get('/custom/analytics')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('daily');
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('average');
    });

    it('should respect date filters', async () => {
      const response = await request(app)
        .get('/custom/analytics')
        .query({
          start_date: '2024-01-01',
          end_date: '2024-01-31',
        })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.period).toBe('30_days');
    });
  });
});
```

## Migration Scripts

### Database Migrations

```typescript
// migrations/001_create_analytics_tables.ts
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create analytics events table
  await knex.schema.createTable('analytics_events', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('category', 50).notNullable();
    table.string('action', 50).notNullable();
    table.string('label', 100);
    table.decimal('value', 10, 2);
    table.uuid('user_id').references('id').inTable('directus_users');
    table.jsonb('metadata');
    table.string('session_id', 100);
    table.string('ip_address', 45);
    table.timestamp('created_at').defaultTo(knex.fn.now());

    // Indexes for performance
    table.index(['category', 'action']);
    table.index('user_id');
    table.index('created_at');
    table.index(['category', 'created_at']);
  });

  // Create aggregates table
  await knex.schema.createTable('analytics_aggregates', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.date('date').notNullable();
    table.string('category', 50).notNullable();
    table.string('action', 50).notNullable();
    table.integer('count').defaultTo(0);
    table.decimal('sum_value', 12, 2).defaultTo(0);
    table.integer('unique_users').defaultTo(0);
    table.timestamps(true, true);

    // Composite unique constraint
    table.unique(['date', 'category', 'action']);
    table.index('date');
  });

  // Add trigger for auto-aggregation
  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_analytics_aggregates()
    RETURNS TRIGGER AS $$
    BEGIN
      INSERT INTO analytics_aggregates (date, category, action, count, sum_value)
      VALUES (DATE(NEW.created_at), NEW.category, NEW.action, 1, COALESCE(NEW.value, 0))
      ON CONFLICT (date, category, action)
      DO UPDATE SET
        count = analytics_aggregates.count + 1,
        sum_value = analytics_aggregates.sum_value + COALESCE(NEW.value, 0);
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER analytics_events_aggregate
    AFTER INSERT ON analytics_events
    FOR EACH ROW
    EXECUTE FUNCTION update_analytics_aggregates();
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP TRIGGER IF EXISTS analytics_events_aggregate ON analytics_events');
  await knex.raw('DROP FUNCTION IF EXISTS update_analytics_aggregates()');
  await knex.schema.dropTableIfExists('analytics_aggregates');
  await knex.schema.dropTableIfExists('analytics_events');
}
```

## Monitoring & Logging

### Custom Logger

```typescript
// src/logger/custom-logger.ts
import winston from 'winston';
import { ElasticsearchTransport } from 'winston-elasticsearch';

export class CustomLogger {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: {
        service: 'directus-backend',
        environment: process.env.NODE_ENV,
      },
      transports: [
        // Console transport
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
        }),

        // File transport
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        }),

        new winston.transports.File({
          filename: 'logs/combined.log',
          maxsize: 5242880,
          maxFiles: 5,
        }),

        // Elasticsearch transport for centralized logging
        new ElasticsearchTransport({
          level: 'info',
          clientOpts: {
            node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
          },
          index: 'directus-logs',
        }),
      ],
    });
  }

  info(message: string, meta?: any): void {
    this.logger.info(message, meta);
  }

  error(message: string, error?: Error, meta?: any): void {
    this.logger.error(message, {
      ...meta,
      error: {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
      },
    });
  }

  warn(message: string, meta?: any): void {
    this.logger.warn(message, meta);
  }

  debug(message: string, meta?: any): void {
    this.logger.debug(message, meta);
  }

  // Performance logging
  logPerformance(operation: string, duration: number, meta?: any): void {
    this.logger.info(`Performance: ${operation}`, {
      ...meta,
      duration_ms: duration,
      slow: duration > 1000,
    });
  }

  // Audit logging
  logAudit(action: string, userId: string, details: any): void {
    this.logger.info(`Audit: ${action}`, {
      audit: true,
      user_id: userId,
      action,
      details,
      timestamp: new Date().toISOString(),
    });
  }
}
```

## Success Metrics

- ✅ API endpoints respond within 200ms for 95% of requests
- ✅ Database queries optimized with proper indexing
- ✅ Hooks execute without blocking main operations
- ✅ Flows process batches efficiently without memory leaks
- ✅ Authentication system secure with proper token management
- ✅ Caching reduces database load by 60%+
- ✅ Error handling prevents data corruption
- ✅ Logging provides complete audit trail
- ✅ Tests achieve 80%+ code coverage
- ✅ Migrations run without data loss

## Resources

- [Directus API Documentation](https://docs.directus.io/reference/introduction.html)
- [Directus Extensions SDK](https://docs.directus.io/extensions/introduction.html)
- [Knex.js Query Builder](https://knexjs.org/)
- [Express.js Middleware](https://expressjs.com/en/guide/using-middleware.html)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)

## Version History

- **1.0.0** - Initial release with comprehensive backend architecture patterns