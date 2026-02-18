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
			logger.debug(`[webhook:${provider}] No raw body`);
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
			logger.warn(`[webhook:${provider}] No webhook config found`);
			return res.sendStatus(404);
		}

		if (!webhookConfig.webhook_secret) {
			logger.warn(`[webhook:${provider}] No webhook secret configured`);
			return res.sendStatus(404);
		}

		const driver = getDeploymentDriver(provider as ProviderType, webhookConfig.credentials, webhookConfig.options);

		// Fallback for providers whose API doesn't support webhook signature headers (e.g. Netlify)
		const headers: Record<string, string | string[] | undefined> = { ...req.headers };
		const queryToken = req.query['token'];

		if (typeof queryToken === 'string') {
			headers['x-webhook-token'] = queryToken;
		}

		const event = driver.verifyAndParseWebhook(rawBody, headers, webhookConfig.webhook_secret);

		if (!event) {
			logger.warn(`[webhook:${provider}] Verification failed or unknown event`);

			try {
				const body = JSON.parse(rawBody.toString('utf-8'));
				logger.warn(`[webhook:${provider}] Raw event type: ${body.type ?? body.state ?? 'unknown'}`);
			} catch {
				// ignore parse error
			}

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
			logger.info(`[webhook:${provider}] Project ${event.project_external_id} not tracked, ignoring`);
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

			const updatePayload = {
				status: event.status,
				...(event.url ? { url: event.url } : {}),
				...(event.type === 'deployment.created' ? { started_at: event.timestamp.toISOString() } : {}),
				...(isTerminal ? { completed_at: event.timestamp.toISOString() } : {}),
			};

			await runsService.updateOne(runId, updatePayload);
		} else {
			const createPayload = {
				project: project.id,
				external_id: event.deployment_external_id,
				target: event.target || 'production',
				status: event.status,
				...(event.url ? { url: event.url } : {}),
				started_at: event.type === 'deployment.created' ? event.timestamp.toISOString() : null,
				...(isTerminal ? { completed_at: event.timestamp.toISOString() } : {}),
			};

			runId = (await runsService.createOne(createPayload)) as string;
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

		logger.info(`[webhook:${provider}] Processed: ${event.type} → run ${runId}`);

		return res.sendStatus(200);
	}),
);

export default router;
