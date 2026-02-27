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
				logger.warn(`[webhook:${provider}] Unparseable body: ${rawBody.toString('utf-8').slice(0, 200)}`);
			}

			return res.sendStatus(401);
		}

		// Look up project by external_id
		const projectsService = new DeploymentProjectsService({
			schema,
			knex,
			accountability: null,
		});

		const project = await projectsService.readByExternalId(event.project_external_id);

		if (!project) {
			// 410 signals the provider this project is no longer tracked
			logger.info(`[webhook:${provider}] Project ${event.project_external_id} not tracked`);
			return res.sendStatus(410);
		}

		const runsService = new DeploymentRunsService({
			schema,
			knex,
			accountability: null,
		});

		const runId = await runsService.processWebhookEvent(project.id, event);

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

		emitter.emitAction(['deployment.webhook', `deployment.webhook.${event.type}`], eventPayload, null);

		logger.info(`[webhook:${provider}] Processed: ${event.type} → run ${runId}`);

		return res.sendStatus(200);
	}),
);

export default router;
