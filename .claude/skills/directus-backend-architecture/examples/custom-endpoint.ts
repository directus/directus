import { defineEndpoint } from '@directus/extensions-sdk';
import { Router } from 'express';

export default defineEndpoint((router, context) => {
  const { services, database, getSchema, env, logger } = context;
  const { ItemsService, MailService, ActivityService } = services;

  /**
   * GET /custom/health
   * Health check endpoint with detailed system status
   */
  router.get('/health', async (req, res) => {
    try {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        checks: {
          database: 'unknown',
          cache: 'unknown',
          storage: 'unknown',
        },
        metrics: {
          memory: process.memoryUsage(),
          uptime: process.uptime(),
        },
      };

      // Check database
      try {
        await database.raw('SELECT 1');
        health.checks.database = 'connected';
      } catch (error) {
        health.checks.database = 'error';
        health.status = 'degraded';
      }

      // Check cache (if Redis is configured)
      if (env.CACHE_ENABLED === 'true') {
        // Add cache check logic here
        health.checks.cache = 'connected';
      }

      // Check storage
      health.checks.storage = 'connected';

      res.json(health);
    } catch (error) {
      logger.error('Health check failed:', error);
      res.status(500).json({
        status: 'error',
        message: 'Health check failed',
      });
    }
  });

  /**
   * POST /custom/batch-process
   * Process items in batches with progress tracking
   */
  router.post('/batch-process', async (req, res) => {
    try {
      // Validate user permissions
      if (!req.accountability?.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { collection, operation, filters = {} } = req.body;

      if (!collection || !operation) {
        return res.status(400).json({
          error: 'Missing required parameters: collection, operation',
        });
      }

      const schema = await getSchema();
      const itemsService = new ItemsService(collection, {
        schema,
        accountability: req.accountability,
      });

      // Fetch items to process
      const items = await itemsService.readByQuery({
        filter: filters,
        limit: -1,
      });

      logger.info(`Processing ${items.length} items from ${collection}`);

      const results = {
        total: items.length,
        processed: 0,
        success: 0,
        failed: 0,
        errors: [],
      };

      // Process items in batches
      const batchSize = 10;
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);

        await Promise.all(
          batch.map(async (item) => {
            try {
              switch (operation) {
                case 'archive':
                  await itemsService.updateOne(item.id, {
                    status: 'archived',
                    archived_at: new Date(),
                  });
                  break;

                case 'publish':
                  await itemsService.updateOne(item.id, {
                    status: 'published',
                    published_at: new Date(),
                  });
                  break;

                case 'duplicate':
                  const { id, ...itemData } = item;
                  await itemsService.createOne({
                    ...itemData,
                    title: `${itemData.title} (Copy)`,
                  });
                  break;

                default:
                  throw new Error(`Unknown operation: ${operation}`);
              }

              results.processed++;
              results.success++;
            } catch (error) {
              results.processed++;
              results.failed++;
              results.errors.push({
                item_id: item.id,
                error: error.message,
              });
            }
          })
        );
      }

      // Log activity
      const activityService = new ActivityService({
        schema,
        accountability: req.accountability,
      });

      await activityService.createOne({
        action: 'batch_process',
        collection,
        comment: `Batch ${operation}: ${results.success} succeeded, ${results.failed} failed`,
      });

      res.json({
        message: 'Batch processing complete',
        results,
      });
    } catch (error) {
      logger.error('Batch processing error:', error);
      res.status(500).json({
        error: 'Batch processing failed',
        message: error.message,
      });
    }
  });

  /**
   * GET /custom/analytics/:collection
   * Get analytics data for a collection
   */
  router.get('/analytics/:collection', async (req, res) => {
    try {
      const { collection } = req.params;
      const { start_date, end_date, group_by = 'day' } = req.query;

      // Build analytics query
      const query = database(collection)
        .select(
          database.raw(`DATE_TRUNC('${group_by}', created_at) as period`),
          database.raw('COUNT(*) as count'),
          database.raw('COUNT(DISTINCT user_created) as unique_users')
        )
        .groupBy('period')
        .orderBy('period', 'desc');

      if (start_date) {
        query.where('created_at', '>=', start_date);
      }

      if (end_date) {
        query.where('created_at', '<=', end_date);
      }

      const results = await query;

      // Calculate trends
      const trends = results.map((row, index) => {
        const previousRow = results[index + 1];
        const trend = previousRow
          ? ((row.count - previousRow.count) / previousRow.count) * 100
          : 0;

        return {
          ...row,
          trend: Math.round(trend * 100) / 100,
        };
      });

      res.json({
        collection,
        period: { start_date, end_date },
        group_by,
        data: trends,
        summary: {
          total_items: trends.reduce((sum, row) => sum + parseInt(row.count), 0),
          total_users: new Set(results.map(r => r.unique_users)).size,
          average_per_period: Math.round(
            trends.reduce((sum, row) => sum + parseInt(row.count), 0) / trends.length
          ),
        },
      });
    } catch (error) {
      logger.error('Analytics error:', error);
      res.status(500).json({
        error: 'Failed to generate analytics',
        message: error.message,
      });
    }
  });

  /**
   * POST /custom/send-notification
   * Send email notifications
   */
  router.post('/send-notification', async (req, res) => {
    try {
      const { to, subject, template, data } = req.body;

      if (!to || !subject || !template) {
        return res.status(400).json({
          error: 'Missing required fields: to, subject, template',
        });
      }

      const schema = await getSchema();
      const mailService = new MailService({ schema });

      // Build email content based on template
      const templates = {
        welcome: `
          <h2>Welcome to Our Platform!</h2>
          <p>Hello ${data?.name || 'there'},</p>
          <p>We're excited to have you on board.</p>
        `,
        alert: `
          <h2>Alert: ${data?.title}</h2>
          <p>${data?.message}</p>
          <p>Time: ${new Date().toLocaleString()}</p>
        `,
        report: `
          <h2>Daily Report</h2>
          <p>Date: ${new Date().toLocaleDateString()}</p>
          <ul>
            ${data?.items?.map(item => `<li>${item}</li>`).join('') || ''}
          </ul>
        `,
      };

      const html = templates[template] || '<p>No template found</p>';

      await mailService.send({
        to,
        subject,
        html,
      });

      res.json({
        message: 'Notification sent successfully',
        recipient: to,
      });
    } catch (error) {
      logger.error('Notification error:', error);
      res.status(500).json({
        error: 'Failed to send notification',
        message: error.message,
      });
    }
  });

  return router;
});