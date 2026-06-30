import type { DeploymentWebhookEvent } from '@directus/types';
import getDatabase from '../database/index.js';
import { CloudflareDriver } from '../deployment/drivers/cloudflare.js';
import { getDeploymentDriver } from '../deployment.js';
import emitter from '../emitter.js';
import { useLogger } from '../logger/index.js';
import { getSchema } from '../utils/get-schema.js';
import { DeploymentProjectsService } from './deployment-projects.js';
import { DeploymentRunsService } from './deployment-runs.js';
import { DeploymentService } from './deployment.js';

export async function consumeCloudflareQueueEvents(): Promise<void> {
	const logger = useLogger();
	const schema = await getSchema();
	const knex = getDatabase();

	const deploymentService = new DeploymentService({
		accountability: null,
		schema,
		knex,
	});

	let webhookConfig: { credentials: Record<string, any>; options: Record<string, any> };

	let deploymentId: string;

	try {
		const deploymentRow = await deploymentService.readByProvider('cloudflare-workers');
		deploymentId = deploymentRow.id;
		webhookConfig = await deploymentService.getWebhookConfig('cloudflare-workers');
	} catch (error) {
		logger.debug(`[cloudflare-workers:queue] Not running: no cloudflare-workers deployment config (${String(error)})`);
		return;
	}

	if (!String(webhookConfig.options?.['events_queue_id'] ?? '').trim()) {
		return;
	}

	const driver = getDeploymentDriver('cloudflare-workers', webhookConfig.credentials, webhookConfig.options);
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

	await driver.ackQueueMessages(ackLeaseIds, retryLeaseIds);
}
