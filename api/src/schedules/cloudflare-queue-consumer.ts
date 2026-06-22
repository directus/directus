import { useEnv } from '@directus/env';
import getDatabase from '../database/index.js';
import { consumeCloudflareQueueEvents } from '../deployment/cloudflare-queue-consumer.js';
import { useLogger } from '../logger/index.js';
import { DeploymentService } from '../services/deployment.js';
import { getSchema } from '../utils/get-schema.js';
import { scheduleSynchronizedJob } from '../utils/schedule.js';

const env = useEnv();

let runningJob: { stop(): Promise<void> } | null = null;

export async function stopCloudflareQueueConsumer(): Promise<void> {
	if (runningJob) {
		await runningJob.stop();
		runningJob = null;
	}
}

export default async function scheduleCloudflareQueueConsumer() {
	// Guard against double-registration on startup. On config updates use stopCloudflareQueueConsumer()
	// first so the schedule restarts with fresh credentials and options.
	if (runningJob) return;
	const logger = useLogger();
	const schema = await getSchema();
	const knex = getDatabase();

	const deploymentService = new DeploymentService({ accountability: null, schema, knex });

	let deploymentId: string;
	let credentials: Record<string, any>;
	let options: Record<string, any>;

	try {
		const deploymentRow = await deploymentService.readByProvider('cloudflare-workers');
		const webhookConfig = await deploymentService.getWebhookConfig('cloudflare-workers');

		if (!String(webhookConfig.options?.['events_queue_id'] ?? '').trim()) {
			return;
		}

		deploymentId = deploymentRow.id;
		credentials = webhookConfig.credentials;
		options = webhookConfig.options;
	} catch {
		// No Cloudflare deployment config in DB
		return;
	}

	// Poll every 5 minutes by default. Workers Builds typically complete in 1–5 min, so 5-minute
	// polling gives acceptable notification latency without hammering the Queues API on every
	// instance. Override with DEPLOYMENT_CLOUDFLARE_QUEUE_POLL_SCHEDULE (cron expression) if you
	// need tighter latency (e.g. "*/1 * * * *" for every minute) or a looser cadence for cost
	// savings (e.g. "*/15 * * * *" for every 15 minutes).
	const schedule = ((env['DEPLOYMENT_CLOUDFLARE_QUEUE_POLL_SCHEDULE'] as string | undefined)?.trim() ||
		'*/5 * * * *') as string;

	runningJob = scheduleSynchronizedJob('deployment-cloudflare-queue-consumer', schedule, async () => {
		try {
			await consumeCloudflareQueueEvents(deploymentId, credentials, options);
		} catch (error) {
			logger.warn(`[cloudflare-workers:queue] Consumer tick failed: ${String(error)}`);
		}
	});
}
