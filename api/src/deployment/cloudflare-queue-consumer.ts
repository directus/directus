import type { DeploymentWebhookEvent } from '@directus/types';
import getDatabase from '../database/index.js';
import { getDeploymentDriver } from '../deployment.js';
import emitter from '../emitter.js';
import { useLogger } from '../logger/index.js';
import { DeploymentProjectsService } from '../services/deployment-projects.js';
import { DeploymentRunsService } from '../services/deployment-runs.js';
import { getSchema } from '../utils/get-schema.js';
import { CloudflareDriver } from './drivers/cloudflare.js';

export async function consumeCloudflareQueueEvents(
	deploymentId: string,
	credentials: Record<string, any>,
	options: Record<string, any>,
): Promise<void> {
	const logger = useLogger();
	const schema = await getSchema();
	const knex = getDatabase();

	const driver = getDeploymentDriver('cloudflare-workers', credentials, options);
	if (!(driver instanceof CloudflareDriver)) return;

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

	try {
		await driver.ackQueueMessages(ackLeaseIds, retryLeaseIds);
	} catch (error) {
		logger.error(
			`[cloudflare-workers:queue] Failed to ack ${ackLeaseIds.length} message(s) — they will be redelivered: ${String(error)}`,
		);

		throw error;
	}
}
