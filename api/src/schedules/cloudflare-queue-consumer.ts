import { useEnv } from '@directus/env';
import getDatabase from '../database/index.js';
import { consumeCloudflareQueueEvents } from '../deployment/cloudflare-queue-consumer.js';
import { useLogger } from '../logger/index.js';
import { DeploymentService } from '../services/deployment.js';
import { getSchema } from '../utils/get-schema.js';
import { scheduleSynchronizedJob } from '../utils/schedule.js';

const env = useEnv();

export default async function scheduleCloudflareQueueConsumer() {
	const logger = useLogger();
	const schema = await getSchema();
	const knex = getDatabase();

	const deploymentService = new DeploymentService({ accountability: null, schema, knex });
	let queueConfigured = false;

	try {
		const webhookConfig = await deploymentService.getWebhookConfig('cloudflare-workers');
		queueConfigured = !!String(webhookConfig.options?.['events_queue_id'] ?? '').trim();
	} catch {
		// No Cloudflare deployment config in DB
	}

	if (!queueConfigured) {
		return;
	}

	// Minute cadence matches core jobs that use `scheduleSynchronizedJob` / cron defaults (e.g. METRICS_SCHEDULE,
	// WEBSOCKETS_COLLAB_CLUSTER_CLEANUP_CRON). Override with DEPLOYMENT_CLOUDFLARE_QUEUE_POLL_SCHEDULE for tighter latency.
	const schedule = ((env['DEPLOYMENT_CLOUDFLARE_QUEUE_POLL_SCHEDULE'] as string | undefined)?.trim() ||
		'*/1 * * * *') as string;

	scheduleSynchronizedJob('deployment-cloudflare-queue-consumer', schedule, async () => {
		try {
			await consumeCloudflareQueueEvents();
		} catch (error) {
			logger.warn(`[cloudflare-workers:queue] Consumer tick failed: ${String(error)}`);
		}
	});
}
