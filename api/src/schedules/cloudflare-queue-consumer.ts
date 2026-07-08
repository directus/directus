import { useEnv } from '@directus/env';
import getDatabase from '../database/index.js';
import { consumeCloudflareQueueEvents } from '../deployment/cloudflare-queue-consumer.js';
import { CloudflareDriver } from '../deployment/drivers/cloudflare.js';
import { useLogger } from '../logger/index.js';
import { DeploymentService } from '../services/deployment.js';
import { getSchema } from '../utils/get-schema.js';
import { scheduleSynchronizedJob } from '../utils/schedule.js';

const env = useEnv();
const logger = useLogger();

let runningJob: { stop(): Promise<void> } | null = null;

/** Reload config each tick so credential/queue changes apply without re-registering the schedule. */
async function loadCloudflareQueueConfig(): Promise<{ deploymentId: string; driver: CloudflareDriver } | null> {
	const schema = await getSchema();
	const knex = getDatabase();
	const deploymentService = new DeploymentService({ accountability: null, schema, knex });

	const deploymentRow = await deploymentService.tryReadByProvider('cloudflare-workers');
	if (!deploymentRow) return null;

	const webhookConfig = await deploymentService.getWebhookConfig('cloudflare-workers');
	if (!String(webhookConfig.options?.['events_queue_id'] ?? '').trim()) return null;

	return {
		deploymentId: deploymentRow.id,
		driver: new CloudflareDriver(webhookConfig.credentials as any, webhookConfig.options as any),
	};
}

/**
 * Optional queue pull for out-of-band Workers Builds events (git push, CI). Status is otherwise polled via the API.
 */
export async function refreshCloudflareQueueConsumer(): Promise<void> {
	await schedule();
}

/**
 * Schedule the Cloudflare queue consumer
 */
export default async function schedule(): Promise<boolean> {
	await runningJob?.stop();
	runningJob = null;

	let initialConfig;

	try {
		initialConfig = await loadCloudflareQueueConfig();
	} catch (error) {
		logger.warn(error, '[cloudflare-workers:queue] Failed to initialize queue consumer schedule');
		return false;
	}

	if (!initialConfig) {
		return false;
	}

	const cronExpression = env['DEPLOYMENT_CLOUDFLARE_QUEUE_POLL_SCHEDULE'] as string;

	runningJob = scheduleSynchronizedJob('deployment-cloudflare-queue-consumer', cronExpression, async () => {
		let config;

		try {
			config = await loadCloudflareQueueConfig();
		} catch (error) {
			logger.warn(error, '[cloudflare-workers:queue] Failed to reload queue consumer config');
			return;
		}

		if (!config) return;

		await consumeCloudflareQueueEvents(config.deploymentId, config.driver);
	});

	return true;
}
