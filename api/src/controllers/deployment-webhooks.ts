import { DEPLOYMENT_PROVIDER_TYPES, type ProviderType } from '@directus/types';
import express from 'express';
import getDatabase from '../database/index.js';
import { getDeploymentDriver } from '../deployment.js';
import emitter from '../emitter.js';
import { useLogger } from '../logger/index.js';
import { DeploymentProjectsService } from '../services/deployment-projects.js';
import { DeploymentRunsService } from '../services/deployment-runs.js';
import { DeploymentService } from '../services/deployment.js';
import asyncHandler from '../utils/async-handler.js';
import { getSchema } from '../utils/get-schema.js';

const router = express.Router();

router.post(
	'/:provider',
	asyncHandler(async (req, res) => {
		const logger = useLogger();
		const provider = req.params['provider'] as string;

		if (!DEPLOYMENT_PROVIDER_TYPES.includes(provider as ProviderType)) {
			return res.sendStatus(404);
		}

		const rawBody = (req as any).rawBody as Buffer | undefined;

		if (!rawBody) {
			return res.sendStatus(400);
		}

		const schema = await getSchema();
		const knex = getDatabase();

		const deploymentService = new DeploymentService({
			schema,
			knex,
			accountability: null,
		});

		let webhookConfig;

		try {
			webhookConfig = await deploymentService.getWebhookConfig(provider as ProviderType);
		} catch {
			return res.sendStatus(404);
		}

		if (!webhookConfig.webhook_secret) {
			return res.sendStatus(404);
		}

		const driver = getDeploymentDriver(provider as ProviderType, webhookConfig.credentials, webhookConfig.options);

		const event = driver.verifyAndParseWebhook(rawBody, req.headers, webhookConfig.webhook_secret);

		if (!event) {
			return res.sendStatus(401);
		}

		// Look up project by external_id
		const projectsService = new DeploymentProjectsService({
			schema,
			knex,
			accountability: null,
		});

		const projects = await projectsService.readByQuery({
			filter: { external_id: { _eq: event.project_external_id } },
			limit: 1,
		});

		if (!projects || projects.length === 0) {
			// Project not tracked, silently ignore
			return res.sendStatus(200);
		}

		const project = projects[0]!;

		// Check if run already exists
		const runsService = new DeploymentRunsService({
			schema,
			knex,
			accountability: null,
		});

		const existingRuns = await runsService.readByQuery({
			filter: {
				project: { _eq: project.id },
				external_id: { _eq: event.deployment_external_id },
			},
			limit: 1,
		});

		let runId: string;

		const isTerminal =
			event.type === 'deployment.succeeded' ||
			event.type === 'deployment.error' ||
			event.type === 'deployment.canceled';

		if (existingRuns && existingRuns.length > 0) {
			runId = existingRuns[0]!.id;

			await runsService.updateOne(runId, {
				status: event.status,
				...(event.url ? { url: event.url } : {}),
				...(event.type === 'deployment.created' ? { started_at: event.timestamp.toISOString() } : {}),
				...(isTerminal ? { completed_at: event.timestamp.toISOString() } : {}),
			});
		} else {
			runId = (await runsService.createOne({
				project: project.id,
				external_id: event.deployment_external_id,
				target: event.target || 'production',
				status: event.status,
				...(event.url ? { url: event.url } : {}),
				started_at: event.type === 'deployment.created' ? event.timestamp.toISOString() : null,
				...(isTerminal ? { completed_at: event.timestamp.toISOString() } : {}),
			})) as string;
		}

		// Emit action events
		const eventPayload = {
			provider,
			project_id: project.id,
			run_id: runId,
			external_id: event.deployment_external_id,
			status: event.status,
			url: event.url,
			target: event.target,
			timestamp: event.timestamp,
		};

		emitter.emitAction('deployment.webhook', eventPayload, null);
		emitter.emitAction(`deployment.webhook.${event.type}`, eventPayload, null);

		logger.debug(`Webhook received: ${event.type} for ${provider}/${event.project_external_id}`);

		return res.sendStatus(200);
	}),
);

export default router;
