import type { DeploymentWebhookEvent } from '@directus/types';
import getDatabase from '../database/index.js';
import emitter from '../emitter.js';
import { useLogger } from '../logger/index.js';
import { DeploymentProjectsService } from '../services/deployment-projects.js';
import { DeploymentRunsService } from '../services/deployment-runs.js';
import { getSchema } from '../utils/get-schema.js';
import type { DeploymentDriver } from './deployment.js';
import type { CloudflareQueuePullMessage } from './drivers/cloudflare.js';

type DeploymentQueueConsumer = DeploymentDriver & {
	pullQueueMessages(options?: {
		batch_size?: number;
		visibility_timeout_ms?: number;
	}): Promise<CloudflareQueuePullMessage[]>;

	parseQueueMessage(message: CloudflareQueuePullMessage): DeploymentWebhookEvent | null;

	ackQueueMessages(ackLeaseIds: string[], retryLeaseIds: string[]): Promise<void>;
};

function hasQueueConsumer(driver: DeploymentDriver): driver is DeploymentQueueConsumer {
	return (
		typeof (driver as DeploymentQueueConsumer).pullQueueMessages === 'function' &&
		typeof (driver as DeploymentQueueConsumer).parseQueueMessage === 'function' &&
		typeof (driver as DeploymentQueueConsumer).ackQueueMessages === 'function'
	);
}

export async function consumeCloudflareQueueEvents(
	deploymentId: string,
	driver: DeploymentDriver,
): Promise<void> {
	if (!hasQueueConsumer(driver)) return;

	const logger = useLogger();
	const schema = await getSchema();
	const knex = getDatabase();

	let messages;

	try {
		messages = await driver.pullQueueMessages();
	} catch (error) {
		logger.warn(`[cloudflare-workers:queue] Queues API pull failed: ${String(error)}`);
		throw error;
	}

	if (messages.length === 0) {
		return;
	}

	logger.info(`[cloudflare-workers:queue] Pulled ${messages.length} message(s) from queue`);

	const projectsService = new DeploymentProjectsService({
		accountability: null,
		schema,
		knex,
	});

	const runsService = new DeploymentRunsService({
		accountability: null,
		schema,
		knex,
	});

	const ackLeaseIds: string[] = [];
	const retryLeaseIds: string[] = [];

	for (const message of messages) {
		let event: DeploymentWebhookEvent | null = null;

		try {
			event = driver.parseQueueMessage(message);
		} catch (error) {
			logger.warn(`[cloudflare-workers:queue] Failed to parse event: ${String(error)}`);
			retryLeaseIds.push(message.lease_id);
			continue;
		}

		if (!event) {
			const preview =
				typeof message.body === 'string'
					? `${message.body.slice(0, 240)}${message.body.length > 240 ? '…' : ''}`
					: JSON.stringify(message.body).slice(0, 240);

			logger.warn(
				`[cloudflare-workers:queue] Dropping message (not a recognized Workers Builds event). Body preview: ${preview}`,
			);

			ackLeaseIds.push(message.lease_id);
			continue;
		}

		try {
			const projectRows = await projectsService.readByQuery({
				filter: {
					_and: [
						{
							_or: [{ external_id: { _eq: event.project_external_id } }, { name: { _eq: event.project_external_id } }],
						},
						{ deployment: { _eq: deploymentId } },
					],
				},
				limit: 1,
			});

			const project = projectRows?.[0] ?? null;

			if (!project) {
				logger.warn(
					`[cloudflare-workers:queue] No Directus deployment project for Workers Builds workerName "${event.project_external_id}" on this provider. Select that Worker under Cloudflare Workers settings, and ensure your event subscription uses the same Worker script name.`,
				);

				ackLeaseIds.push(message.lease_id);
				continue;
			}

			const runId = await runsService.processWebhookEvent(project.id, event);

			emitter.emitAction(
				['deployment.webhook', `deployment.webhook.${event.type}`],
				{
					provider: event.provider,
					project_id: project.id,
					run_id: runId,
					external_id: event.deployment_external_id,
					status: event.status,
					url: event.url,
					target: event.target,
					timestamp: event.timestamp,
				},
				null,
			);

			ackLeaseIds.push(message.lease_id);
		} catch (error) {
			logger.warn(`[cloudflare-workers:queue] Failed to process event: ${String(error)}`);
			retryLeaseIds.push(message.lease_id);
		}
	}

	await driver.ackQueueMessages(ackLeaseIds, retryLeaseIds);
}
