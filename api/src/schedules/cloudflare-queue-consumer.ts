import { useEnv } from '@directus/env';
import { useLogger } from '../logger/index.js';
import { consumeCloudflareQueueEvents } from '../services/cloudflare-queue-consumer.js';
import { scheduleSynchronizedJob } from '../utils/schedule.js';

const env = useEnv();

export default async function scheduleCloudflareQueueConsumer() {
	const logger = useLogger();

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
