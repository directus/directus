import type { DeploymentWebhookEvent } from '@directus/types';
import getDatabase from '../database/index.js';
import { useLogger } from '../logger/index.js';
import { DeploymentProjectsService } from '../services/deployment-projects.js';
import { DeploymentRunsService } from '../services/deployment-runs.js';
import { getSchema } from '../utils/get-schema.js';
import type { CloudflareDriver } from './drivers/cloudflare.js';

export async function consumeCloudflareQueueEvents(deploymentId: string, driver: CloudflareDriver): Promise<void> {
	const logger = useLogger();
	const schema = await getSchema();
	const knex = getDatabase();

	let messages;

	try {
		messages = await driver.pullQueueMessages();
	} catch (error) {
		logger.debug(error, '[cloudflare-workers:queue] Queues API pull failed');
		return;
	}

	if (messages.length === 0) {
		return;
	}

	logger.debug(`[cloudflare-workers:queue] Pulled ${messages.length} message(s) from queue`);

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
			logger.warn(error, '[cloudflare-workers:queue] Failed to parse event');
			retryLeaseIds.push(message.lease_id);
			continue;
		}

		if (!event) {
			const preview =
				typeof message.body === 'string'
					? `${message.body.slice(0, 240)}${message.body.length > 240 ? '…' : ''}`
					: JSON.stringify(message.body).slice(0, 240);

			logger.debug(
				`[cloudflare-workers:queue] Dropping message (not a recognized Workers Builds event). Body preview: ${preview}`,
			);

			ackLeaseIds.push(message.lease_id);
			continue;
		}

		try {
			const project = await projectsService.readByProviderReference(deploymentId, event.project_external_id);

			if (!project) {
				logger.debug(
					`[cloudflare-workers:queue] No Directus deployment project for Workers Builds workerName "${event.project_external_id}" on this provider. Select that Worker under Cloudflare Workers settings, and ensure your event subscription uses the same Worker script name.`,
				);

				ackLeaseIds.push(message.lease_id);
				continue;
			}

			await runsService.processWebhookEvent(project.id, event);

			ackLeaseIds.push(message.lease_id);
		} catch (error) {
			logger.warn(error, '[cloudflare-workers:queue] Failed to process event');
			retryLeaseIds.push(message.lease_id);
		}
	}

	try {
		await driver.ackQueueMessages(ackLeaseIds, retryLeaseIds);
	} catch (error) {
		logger.warn(error, '[cloudflare-workers:queue] Failed to ack/retry messages');
	}
}
