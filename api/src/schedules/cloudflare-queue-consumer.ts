import { useEnv } from '@directus/env';
import getDatabase from '../database/index.js';
import { consumeCloudflareQueueEvents } from '../deployment/cloudflare-queue-consumer.js';
import { getDeploymentDriver } from '../deployment.js';
import { useLogger } from '../logger/index.js';
import { DeploymentService } from '../services/deployment.js';
import { getSchema } from '../utils/get-schema.js';
import { scheduleSynchronizedJob } from '../utils/schedule.js';

const env = useEnv();

let runningJob: { stop(): Promise<void> } | null = null;

/**
 * Cloudflare Workers Builds does not push webhooks to Directus — run status is polled via the API.
 * When `events_queue_id` is configured, this schedule pulls Workers Builds events from a Cloudflare
 * Queue (event subscriptions) so builds triggered outside Directus (git push, CI) appear in the runs list.
 */
export async function refreshCloudflareQueueConsumer(): Promise<void> {
	await scheduleCloudflareQueueConsumer();
}

export default async function scheduleCloudflareQueueConsumer() {
	await runningJob?.stop();
	runningJob = null;

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

	const driver = getDeploymentDriver('cloudflare-workers', credentials, options);

	const schedule = env['DEPLOYMENT_CLOUDFLARE_QUEUE_POLL_SCHEDULE'] as string;

	runningJob = scheduleSynchronizedJob('deployment-cloudflare-queue-consumer', schedule, async () => {
		try {
			await consumeCloudflareQueueEvents(deploymentId, driver);
		} catch (error) {
			logger.warn(`[cloudflare-workers:queue] Consumer tick failed: ${String(error)}`);
		}
	});
}
