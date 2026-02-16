import {
	ErrorCode,
	ForbiddenError,
	InvalidPathParameterError,
	InvalidPayloadError,
	isDirectusError,
} from '@directus/errors';
import { DEPLOYMENT_PROVIDER_TYPES, type DeploymentConfig, type ProviderType } from '@directus/types';
import express from 'express';
import Joi from 'joi';
import getDatabase from '../database/index.js';
import { useLogger } from '../logger/index.js';
import { respond } from '../middleware/respond.js';
import useCollection from '../middleware/use-collection.js';
import { validateBatch } from '../middleware/validate-batch.js';
import { DeploymentProjectsService } from '../services/deployment-projects.js';
import { DeploymentRunsService } from '../services/deployment-runs.js';
import { DeploymentService } from '../services/deployment.js';
import { MetaService } from '../services/meta.js';
import asyncHandler from '../utils/async-handler.js';
import { getMilliseconds } from '../utils/get-milliseconds.js';
import { transaction } from '../utils/transaction.js';

const router = express.Router();

function parseRange(range: unknown, defaultMs: number): Date {
	const ms = getMilliseconds(range, defaultMs);
	return new Date(Date.now() - ms);
}

router.use(useCollection('directus_deployments'));

// Require admin access for all deployment routes
router.use((_req, _res, next) => {
	if (_req.accountability && _req.accountability.admin !== true) {
		throw new ForbiddenError();
	}

	return next();
});

// Validate provider parameter
const validateProvider = (provider: string): provider is ProviderType => {
	return DEPLOYMENT_PROVIDER_TYPES.includes(provider as ProviderType);
};

// Validation schema for creating/updating deployment
const deploymentSchema = Joi.object({
	provider: Joi.string()
		.valid(...DEPLOYMENT_PROVIDER_TYPES)
		.required(),
	credentials: Joi.object().required(),
	options: Joi.object(),
}).unknown();

// Create deployment config
router.post(
	'/',
	asyncHandler(async (req, res, next) => {
		const { error } = deploymentSchema.validate(req.body);

		if (error) {
			throw new InvalidPayloadError({ reason: error.message });
		}

		const db = getDatabase();

		const item = await transaction(db, async (trx) => {
			const service = new DeploymentService({
				accountability: req.accountability,
				schema: req.schema,
				knex: trx,
			});

			const key = await service.createOne({
				provider: req.body.provider,
				credentials: req.body.credentials,
				options: req.body.options,
			} as Partial<DeploymentConfig>);

			return service.readOne(key, req.sanitizedQuery);
		});

		res.locals['payload'] = { data: item };

		return next();
	}),
	respond,
);

// Read all deployment configs
const readHandler = asyncHandler(async (req, res, next) => {
	const service = new DeploymentService({
		accountability: req.accountability,
		schema: req.schema,
	});

	const metaService = new MetaService({
		accountability: req.accountability,
		schema: req.schema,
	});

	const records = await service.readByQuery(req.sanitizedQuery);
	const meta = await metaService.getMetaForQuery(req.collection, req.sanitizedQuery);

	res.locals['payload'] = { data: records || null, meta };
	return next();
});

router.get('/', validateBatch('read'), readHandler, respond);
router.search('/', validateBatch('read'), readHandler, respond);

// Read single deployment config by provider
router.get(
	'/:provider',
	asyncHandler(async (req, res, next) => {
		const provider = req.params['provider'] as ProviderType;

		if (!validateProvider(provider)) {
			throw new InvalidPathParameterError({ reason: `${provider} is not a supported provider` });
		}

		const service = new DeploymentService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const record = await service.readByProvider(provider, req.sanitizedQuery);
		res.locals['payload'] = { data: record || null };
		return next();
	}),
	respond,
);

// List projects from provider (for config/selection)
router.get(
	'/:provider/projects',
	asyncHandler(async (req, res, next) => {
		const provider = req.params['provider'] as ProviderType;

		if (!validateProvider(provider)) {
			throw new InvalidPathParameterError({ reason: `${provider} is not a supported provider` });
		}

		const service = new DeploymentService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const projectsService = new DeploymentProjectsService({
			accountability: req.accountability,
			schema: req.schema,
		});

		// Get provider config to find deployment ID
		const deployment = await service.readByProvider(provider);

		// Get projects from provider (with cache)
		const { data: providerProjects, remainingTTL } = await service.listProviderProjects(provider);

		// Get selected projects from DB
		const selectedProjects = await projectsService.readByQuery({
			filter: { deployment: { _eq: deployment.id } },
		});

		// Map by external_id for quick lookup
		const selectedMap = new Map(selectedProjects.map((p) => [p.external_id, p]));

		// Sync names from provider
		const namesToUpdate = selectedProjects
			.map((dbProject) => {
				const providerProject = providerProjects.find((p) => p.id === dbProject.external_id);

				if (providerProject && providerProject.name !== dbProject.name) {
					return { id: dbProject.id, name: providerProject.name };
				}

				return null;
			})
			.filter((update): update is { id: string; name: string } => update !== null);

		if (namesToUpdate.length > 0) {
			await projectsService.updateBatch(namesToUpdate);
		}

		// Merge with DB structure (id !== null means selected)
		const projects = providerProjects.map((project) => {
			return {
				id: selectedMap.get(project.id)?.id ?? null,
				external_id: project.id,
				name: project.name,
				deployable: project.deployable,
				framework: project.framework,
			};
		});

		// Pass remaining TTL for response headers
		res.locals['cache'] = false;
		res.locals['cacheTTL'] = remainingTTL;
		res.locals['payload'] = { data: projects };

		return next();
	}),
	respond,
);

// Get single project details
router.get(
	'/:provider/projects/:id',
	asyncHandler(async (req, res, next) => {
		const provider = req.params['provider'] as ProviderType;
		const projectId = req.params['id'] as string;

		if (!validateProvider(provider)) {
			throw new InvalidPathParameterError({ reason: `${provider} is not a supported provider` });
		}

		const service = new DeploymentService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const projectsService = new DeploymentProjectsService({
			accountability: req.accountability,
			schema: req.schema,
		});

		// Get project from DB (validates it exists and is selected)
		const project = await projectsService.readOne(projectId);

		// Fetch details from provider using external_id (with cache)
		const { data: details, remainingTTL } = await service.getProviderProject(provider, project.external_id);

		// Pass remaining TTL for response headers
		res.locals['cache'] = false;
		res.locals['cacheTTL'] = remainingTTL;

		res.locals['payload'] = {
			data: {
				...details,
				id: project.id,
				external_id: project.external_id,
			},
		};

		return next();
	}),
	respond,
);

// Update selected projects
const updateProjectsSchema = Joi.object({
	create: Joi.array()
		.items(
			Joi.object({
				external_id: Joi.string().required(),
				name: Joi.string().required(),
			}),
		)
		.default([]),
	delete: Joi.array().items(Joi.string()).default([]),
});

router.patch(
	'/:provider/projects',
	asyncHandler(async (req, res, next) => {
		const provider = req.params['provider'] as ProviderType;

		if (!validateProvider(provider)) {
			throw new InvalidPathParameterError({ reason: `${provider} is not a supported provider` });
		}

		const { error, value } = updateProjectsSchema.validate(req.body);

		if (error) {
			throw new InvalidPayloadError({ reason: error.message });
		}

		const service = new DeploymentService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const projectsService = new DeploymentProjectsService({
			accountability: req.accountability,
			schema: req.schema,
		});

		// Get provider config
		const deployment = await service.readByProvider(provider);

		// Validate deployable projects before any mutation
		if (value.create.length > 0) {
			const driver = await service.getDriver(provider);
			const providerProjects = await driver.listProjects();
			const projectsMap = new Map(providerProjects.map((p) => [p.id, p]));

			const nonDeployable = value.create.filter(
				(p: { external_id: string }) => !projectsMap.get(p.external_id)?.deployable,
			);

			if (nonDeployable.length > 0) {
				const names = nonDeployable
					.map((p: { external_id: string }) => projectsMap.get(p.external_id)?.name || p.external_id)
					.join(', ');

				throw new InvalidPayloadError({
					reason: `Cannot add non-deployable projects: ${names}`,
				});
			}
		}

		const updatedProjects = await projectsService.updateSelection(deployment.id, value.create, value.delete);

		// Sync webhook with updated project list
		service.syncWebhook(provider).catch((err) => {
			const logger = useLogger();
			logger.error(`Failed to sync webhook for ${provider}: ${err}`);
		});

		res.locals['payload'] = { data: updatedProjects };
		return next();
	}),
	respond,
);

// Dashboard - selected projects with stats
const dashboardQuerySchema = Joi.object({
	range: Joi.string()
		.pattern(/^\d+(ms|s|m|h|d|w|y)$/)
		.optional(),
});

router.get(
	'/:provider/dashboard',
	asyncHandler(async (req, res, next) => {
		const provider = req.params['provider'] as ProviderType;

		if (!validateProvider(provider)) {
			throw new InvalidPathParameterError({ reason: `${provider} is not a supported provider` });
		}

		const { error, value } = dashboardQuerySchema.validate(req.query);

		if (error) {
			throw new InvalidPayloadError({ reason: error.message });
		}

		const sinceDate = parseRange(value.range, 86_400_000);

		const service = new DeploymentService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const projectsService = new DeploymentProjectsService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const runsService = new DeploymentRunsService({
			accountability: req.accountability,
			schema: req.schema,
		});

		// Get provider config
		const deployment = await service.readByProvider(provider);

		// Get selected projects from DB
		const selectedProjects = await projectsService.readByQuery({
			filter: { deployment: { _eq: deployment.id } },
		});

		if (selectedProjects.length === 0) {
			res.locals['payload'] = {
				data: {
					projects: [],
					stats: { active_deployments: 0, successful_builds: 0, failed_builds: 0 },
				},
			};

			return next();
		}

		const projectIds = selectedProjects.map((p) => p.id);

		const driver = await service.getDriver(provider);

		const [projectDetails, activeResult, statusCounts] = await Promise.all([
			Promise.all(
				selectedProjects.map(async (p) => {
					const details = await driver.getProject(p.external_id);

					return {
						...details,
						id: p.id,
						external_id: p.external_id,
					};
				}),
			),
			// Active deployments
			runsService.readByQuery({
				filter: { project: { _in: projectIds }, status: { _eq: 'building' } },
				aggregate: { count: ['*'] },
			}) as Promise<any[]>,
			// Grouped counts by status within date range
			runsService.readByQuery({
				filter: {
					_and: [
						{ project: { _in: projectIds } },
						{ status: { _in: ['ready', 'error'] } },
						{ date_created: { _gte: sinceDate.toISOString() } },
					],
				},
				aggregate: { count: ['*'] },
				group: ['status'],
			}) as Promise<any[]>,
		]);

		const countByStatus = (status: string) =>
			Number(statusCounts.find((r: any) => r['status'] === status)?.['count'] ?? 0);

		// Disable cache - dashboard needs fresh data from provider
		res.locals['cache'] = false;

		res.locals['payload'] = {
			data: {
				projects: projectDetails,
				stats: {
					active_deployments: Number(activeResult[0]?.['count'] ?? 0),
					successful_builds: countByStatus('ready'),
					failed_builds: countByStatus('error'),
				},
			},
		};

		return next();
	}),
	respond,
);

// Trigger deployment for a project
const triggerDeploySchema = Joi.object({
	preview: Joi.boolean().default(false),
	clear_cache: Joi.boolean().default(true), // Default at true (matches Vercel UI behavior)
});

router.post(
	'/:provider/projects/:id/deploy',
	asyncHandler(async (req, res, next) => {
		const provider = req.params['provider'] as ProviderType;
		const projectId = req.params['id']!;

		if (!validateProvider(provider)) {
			throw new InvalidPathParameterError({ reason: `${provider} is not a supported provider` });
		}

		const { error, value } = triggerDeploySchema.validate(req.body);

		if (error) {
			throw new InvalidPayloadError({ reason: error.message });
		}

		const service = new DeploymentService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const projectsService = new DeploymentProjectsService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const runsService = new DeploymentRunsService({
			accountability: req.accountability,
			schema: req.schema,
		});

		// Get project from DB
		const project = await projectsService.readOne(projectId);

		// Trigger deployment via driver
		const driver = await service.getDriver(provider);

		const result = await driver.triggerDeployment(project.external_id, {
			preview: value.preview,
			clearCache: value.clear_cache,
		});

		// Store run in DB with initial data from trigger response
		const runId = await runsService.createOne({
			project: projectId,
			external_id: result.deployment_id,
			target: value.preview ? 'preview' : 'production',
			status: result.status,
			started_at: result.created_at.toISOString(),
			...(result.url ? { url: result.url } : {}),
		});

		const run = await runsService.readOne(runId);

		res.locals['payload'] = { data: run };

		return next();
	}),
	respond,
);

// Update deployment config by provider
router.patch(
	'/:provider',
	asyncHandler(async (req, res, next) => {
		const provider = req.params['provider'] as ProviderType;

		if (!validateProvider(provider)) {
			throw new InvalidPathParameterError({ reason: `${provider} is not a supported provider` });
		}

		const db = getDatabase();

		const item = await transaction(db, async (trx) => {
			const service = new DeploymentService({
				accountability: req.accountability,
				schema: req.schema,
				knex: trx,
			});

			const data: Partial<DeploymentConfig> = {};

			if ('credentials' in req.body) data['credentials'] = req.body.credentials;
			if ('options' in req.body) data['options'] = req.body.options;

			const primaryKey = await service.updateByProvider(provider, data);

			try {
				return await service.readOne(primaryKey, req.sanitizedQuery);
			} catch (error: any) {
				if (isDirectusError(error, ErrorCode.Forbidden)) {
					return null;
				}

				throw error;
			}
		});

		res.locals['payload'] = { data: item };

		return next();
	}),
	respond,
);

// Delete deployment config by provider
router.delete(
	'/:provider',
	asyncHandler(async (req, _res, next) => {
		const provider = req.params['provider'] as ProviderType;

		if (!validateProvider(provider)) {
			throw new InvalidPathParameterError({ reason: `${provider} is not a supported provider` });
		}

		const service = new DeploymentService({
			accountability: req.accountability,
			schema: req.schema,
		});

		await service.deleteByProvider(provider);

		return next();
	}),
	respond,
);

// List runs for a project
router.get(
	'/:provider/projects/:id/runs',
	asyncHandler(async (req, res, next) => {
		const provider = req.params['provider'] as ProviderType;
		const projectId = req.params['id']!;

		if (!validateProvider(provider)) {
			throw new InvalidPathParameterError({ reason: `${provider} is not a supported provider` });
		}

		const projectsService = new DeploymentProjectsService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const runsService = new DeploymentRunsService({
			accountability: req.accountability,
			schema: req.schema,
		});

		// Validate project exists
		await projectsService.readOne(projectId);

		const query = {
			...req.sanitizedQuery,
			filter: { project: { _eq: projectId } },
			sort: ['-date_created'],
			limit: req.sanitizedQuery.limit ?? 10,
			fields: ['*', 'user_created.first_name', 'user_created.last_name', 'user_created.email'],
		};

		const runs = await runsService.readByQuery(query);

		const metaService = new MetaService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const meta = await metaService.getMetaForQuery('directus_deployment_runs', query);

		res.locals['payload'] = { data: runs, meta };
		return next();
	}),
	respond,
);

// Project runs stats
const runStatsQuerySchema = Joi.object({
	range: Joi.string()
		.pattern(/^\d+(ms|s|m|h|d|w|y)$/)
		.optional(),
});

router.get(
	'/:provider/projects/:id/runs/stats',
	asyncHandler(async (req, res, next) => {
		const provider = req.params['provider'] as ProviderType;
		const projectId = req.params['id']!;

		if (!validateProvider(provider)) {
			throw new InvalidPathParameterError({ reason: `${provider} is not a supported provider` });
		}

		const { error, value } = runStatsQuerySchema.validate(req.query);

		if (error) {
			throw new InvalidPayloadError({ reason: error.message });
		}

		const sinceDate = parseRange(value.range, 604_800_000);

		const projectsService = new DeploymentProjectsService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const runsService = new DeploymentRunsService({
			accountability: req.accountability,
			schema: req.schema,
		});

		// Validate project exists
		await projectsService.readOne(projectId);

		const dateFilter = {
			_and: [{ project: { _eq: projectId } }, { date_created: { _gte: sinceDate.toISOString() } }],
		};

		const [countResult, completedRuns] = await Promise.all([
			runsService.readByQuery({
				filter: dateFilter,
				aggregate: { count: ['*'] },
			}) as Promise<any[]>,
			runsService.readByQuery({
				filter: {
					_and: [
						{ project: { _eq: projectId } },
						{ date_created: { _gte: sinceDate.toISOString() } },
						{ started_at: { _nnull: true } },
						{ completed_at: { _nnull: true } },
					],
				},
				fields: ['started_at', 'completed_at'],
				limit: -1,
			}),
		]);

		let averageBuildTime: number | null = null;

		if (completedRuns.length > 0) {
			const durations = completedRuns.map(
				(r) => new Date(r.completed_at!).getTime() - new Date(r.started_at!).getTime(),
			);

			averageBuildTime = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
		}

		res.locals['payload'] = {
			data: {
				total_deployments: Number(countResult[0]?.['count'] ?? 0),
				average_build_time: averageBuildTime,
			},
		};

		return next();
	}),
	respond,
);

// Get single run details
const runDetailsQuerySchema = Joi.object({
	since: Joi.date().iso().optional(),
	_t: Joi.number().optional(), // Cache-buster parameter for polling
});

router.get(
	'/:provider/runs/:id',
	asyncHandler(async (req, res, next) => {
		const provider = req.params['provider'] as ProviderType;
		const runId = req.params['id']!;

		if (!validateProvider(provider)) {
			throw new InvalidPathParameterError({ reason: `${provider} is not a supported provider` });
		}

		const { error, value } = runDetailsQuerySchema.validate(req.query);

		if (error) {
			throw new InvalidPayloadError({ reason: error.message });
		}

		const sinceDate: Date | undefined = value.since;

		const runsService = new DeploymentRunsService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const service = new DeploymentService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const run = await runsService.readOne(runId);

		const driver = await service.getDriver(provider);
		const logs = await driver.getDeploymentLogs(run.external_id, sinceDate ? { since: sinceDate } : undefined);

		res.locals['cache'] = false;

		res.locals['payload'] = {
			data: {
				...run,
				logs,
			},
		};

		return next();
	}),
	respond,
);

// Cancel a deployment
router.post(
	'/:provider/runs/:id/cancel',
	asyncHandler(async (req, res, next) => {
		const provider = req.params['provider'] as ProviderType;
		const runId = req.params['id']!;

		if (!validateProvider(provider)) {
			throw new InvalidPathParameterError({ reason: `${provider} is not a supported provider` });
		}

		const runsService = new DeploymentRunsService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const service = new DeploymentService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const run = await runsService.readOne(runId);

		const driver = await service.getDriver(provider);
		await driver.cancelDeployment(run.external_id);

		await runsService.updateOne(runId, {
			status: 'canceled',
		});

		const updatedRun = await runsService.readOne(runId);

		res.locals['payload'] = { data: updatedRun };

		return next();
	}),
	respond,
);

export default router;
