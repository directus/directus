import { ErrorCode, InvalidPayloadError, InvalidProviderConfigError, isDirectusError } from '@directus/errors';
import { DEPLOYMENT_PROVIDER_TYPES, type ProviderType } from '@directus/types';
import express from 'express';
import Joi from 'joi';
import getDatabase from '../database/index.js';
import { getDeploymentDriver } from '../deployment.js';
import { respond } from '../middleware/respond.js';
import useCollection from '../middleware/use-collection.js';
import { validateBatch } from '../middleware/validate-batch.js';
import { DeploymentProjectsService } from '../services/deployment-projects.js';
import { DeploymentRunsService } from '../services/deployment-runs.js';
import { DeploymentService } from '../services/deployment.js';
import { MetaService } from '../services/meta.js';
import asyncHandler from '../utils/async-handler.js';
import { transaction } from '../utils/transaction.js';

const router = express.Router();

router.use(useCollection('directus_deployment'));

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
				credentials: JSON.stringify(req.body.credentials),
				options: req.body.options ? JSON.stringify(req.body.options) : null,
			} as Record<string, unknown>);

			const driver = getDeploymentDriver(req.body.provider, req.body.credentials, req.body.options);

			try {
				await driver.testConnection();
			} catch {
				throw new InvalidProviderConfigError({
					provider: req.body.provider,
					reason: 'Invalid API token',
				});
			}

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
		const provider = req.params['provider']!;

		if (!validateProvider(provider)) {
			throw new InvalidPayloadError({ reason: `Invalid provider: ${provider}` });
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
		const provider = req.params['provider']!;

		if (!validateProvider(provider)) {
			throw new InvalidPayloadError({ reason: `Invalid provider: ${provider}` });
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
		const provider = req.params['provider']!;
		const projectId = req.params['id']!;

		if (!validateProvider(provider)) {
			throw new InvalidPayloadError({ reason: `Invalid provider: ${provider}` });
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
		const provider = req.params['provider']!;

		if (!validateProvider(provider)) {
			throw new InvalidPayloadError({ reason: `Invalid provider: ${provider}` });
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

		res.locals['payload'] = { data: updatedProjects };
		return next();
	}),
	respond,
);

// Dashboard - selected projects with stats
router.get(
	'/:provider/dashboard',
	asyncHandler(async (req, res, next) => {
		const provider = req.params['provider']!;

		if (!validateProvider(provider)) {
			throw new InvalidPayloadError({ reason: `Invalid provider: ${provider}` });
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

		// Get selected projects from DB
		const selectedProjects = await projectsService.readByQuery({
			filter: { deployment: { _eq: deployment.id } },
		});

		if (selectedProjects.length === 0) {
			res.locals['payload'] = { data: { projects: [] } };
			return next();
		}

		// Fetch full details for each selected project (parallel)
		const driver = await service.getDriver(provider);

		const projectDetails = await Promise.all(
			selectedProjects.map(async (p) => {
				const details = await driver.getProject(p.external_id);

				return {
					...details,
					id: p.id,
					external_id: p.external_id,
				};
			}),
		);

		// Disable cache - dashboard needs fresh data from provider
		res.locals['cache'] = false;
		res.locals['payload'] = { data: { projects: projectDetails } };
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
		const provider = req.params['provider']!;
		const projectId = req.params['id']!;

		if (!validateProvider(provider)) {
			throw new InvalidPayloadError({ reason: `Invalid provider: ${provider}` });
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
			clearCache: value.clearCache,
		});

		// Store run in DB
		const runId = await runsService.createOne({
			project: projectId,
			external_id: result.deployment_id,
			target: value.preview ? 'preview' : 'production',
		});

		const run = await runsService.readOne(runId);

		res.locals['payload'] = {
			data: {
				...run,
				status: result.status,
				url: result.url,
			},
		};

		return next();
	}),
	respond,
);

// Update deployment config by provider
router.patch(
	'/:provider',
	asyncHandler(async (req, res, next) => {
		const provider = req.params['provider']!;

		if (!validateProvider(provider)) {
			throw new InvalidPayloadError({ reason: `Invalid provider: ${provider}` });
		}

		const db = getDatabase();

		const item = await transaction(db, async (trx) => {
			const service = new DeploymentService({
				accountability: req.accountability,
				schema: req.schema,
				knex: trx,
			});

			let primaryKey;

			if ('credentials' in req.body || 'options' in req.body) {
				// Service handles permission check and connection test error wrapping
				const result = await service.updateWithConnectionTest(provider, req.body.credentials, req.body.options);

				primaryKey = result.primaryKey;
			} else {
				// No credentials/options change, just update other fields
				primaryKey = await service.updateByProvider(provider, {});
			}

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
		const provider = req.params['provider']!;

		if (!validateProvider(provider)) {
			throw new InvalidPayloadError({ reason: `Invalid provider: ${provider}` });
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
		// Disable cache - runs status needs to be fresh from provider
		res.locals['cache'] = false;

		const provider = req.params['provider']!;
		const projectId = req.params['id']!;

		if (!validateProvider(provider)) {
			throw new InvalidPayloadError({ reason: `Invalid provider: ${provider}` });
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

		// Validate project exists
		await projectsService.readOne(projectId);

		// Get paginated runs from DB (default limit: 10)
		const query = {
			...req.sanitizedQuery,
			filter: { project: { _eq: projectId } },
			sort: ['-date_created'],
			limit: req.sanitizedQuery.limit ?? 10,
			fields: ['*', 'user_created.first_name', 'user_created.last_name', 'user_created.email'],
		};

		const runs = await runsService.readByQuery(query);

		// Get pagination meta
		const metaService = new MetaService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const meta = await metaService.getMetaForQuery('directus_deployment_runs', query);

		// Fetch status for each run from provider
		const driver = await service.getDriver(provider);

		const runsWithStatus = await Promise.all(
			runs.map(async (run: any) => {
				const details = await driver.getDeployment(run.external_id);

				return {
					...run,
					...details,
					id: run.id,
					external_id: run.external_id,
				};
			}),
		);

		res.locals['payload'] = { data: runsWithStatus, meta };
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
		const provider = req.params['provider']!;
		const runId = req.params['id']!;

		if (!validateProvider(provider)) {
			throw new InvalidPayloadError({ reason: `Invalid provider: ${provider}` });
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

		const [details, logs] = await Promise.all([
			driver.getDeployment(run.external_id),
			driver.getDeploymentLogs(run.external_id, sinceDate ? { since: sinceDate } : undefined),
		]);

		res.locals['cache'] = false;

		res.locals['payload'] = {
			data: {
				...run,
				...details,
				id: run.id,
				external_id: run.external_id,
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
		const provider = req.params['provider']!;
		const runId = req.params['id']!;

		if (!validateProvider(provider)) {
			throw new InvalidPayloadError({ reason: `Invalid provider: ${provider}` });
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

		// Fetch updated status
		const details = await driver.getDeployment(run.external_id);

		res.locals['payload'] = {
			data: {
				...run,
				...details,
				id: run.id,
				external_id: run.external_id,
			},
		};

		return next();
	}),
	respond,
);

export default router;
