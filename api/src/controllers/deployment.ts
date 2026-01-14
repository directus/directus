import { ErrorCode, InvalidPayloadError, isDirectusError } from '@directus/errors';
import express from 'express';
import Joi from 'joi';
import { getDeploymentDriver } from '../deployment.js';
import { respond } from '../middleware/respond.js';
import useCollection from '../middleware/use-collection.js';
import { validateBatch } from '../middleware/validate-batch.js';
import { DeploymentProjectsService } from '../services/deployment-projects.js';
import { DeploymentRunsService } from '../services/deployment-runs.js';
import { DeploymentService } from '../services/deployment.js';
import { MetaService } from '../services/meta.js';
import { DEPLOYMENT_PROVIDER_TYPES, type ProviderType } from '../types/index.js';
import asyncHandler from '../utils/async-handler.js';

const router = express.Router();

router.use(useCollection('directus_deployment'));

// Validation schema for creating/updating deployment
const deploymentSchema = Joi.object({
	provider: Joi.string().valid(...DEPLOYMENT_PROVIDER_TYPES).required(),
	credentials: Joi.object().required(),
	options: Joi.object(),
}).unknown();

// Validate provider parameter
const validateProvider = (provider: string): provider is ProviderType => {
	return DEPLOYMENT_PROVIDER_TYPES.includes(provider as ProviderType);
};

// Create deployment config
router.post(
	'/',
	asyncHandler(async (req, res, next) => {
		const { error } = deploymentSchema.validate(req.body);

		if (error) {
			throw new InvalidPayloadError({ reason: error.message });
		}

		// Test connection before saving
		const driver = getDeploymentDriver(req.body.provider, req.body.credentials, req.body.options);
		await driver.testConnection();

		const service = new DeploymentService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const data = {
			...req.body,
			credentials: JSON.stringify(req.body.credentials),
			options: req.body.options ? JSON.stringify(req.body.options) : null,
		};

		const key = await service.createOne(data);
		const item = await service.readOne(key, req.sanitizedQuery);
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

		// Get projects from provider
		const driver = await service.getDriver(provider);
		const providerProjects = await driver.listProjects();

		// Get selected projects from DB
		const selectedProjects = await projectsService.readByQuery({
			filter: { deployment: { _eq: deployment.id } },
		});

		// Map by external_id for quick lookup
		const selectedMap = new Map(selectedProjects.map((p) => [p.external_id, p]));

		// Merge with DB structure (id !== null means selected)
		const projects = providerProjects.map((project) => {
			const selected = selectedMap.get(project.id);

			return {
				id: selected?.id ?? null,
				external_id: project.id,
				name: project.name,
				deployable: project.deployable,
				framework: project.framework,
			};
		});

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

		// Fetch details from provider using external_id
		const driver = await service.getDriver(provider);
		const details = await driver.getProject(project.external_id);

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

		// Delete projects
		if (value.delete.length > 0) {
			await projectsService.deleteMany(value.delete);
		}

		// Create new projects
		if (value.create.length > 0) {
			// Validate that all projects are deployable
			const driver = await service.getDriver(provider);
			const providerProjects = await driver.listProjects();
			const deployableMap = new Map(providerProjects.map((p) => [p.id, p.deployable]));

			const nonDeployable = value.create.filter(
				(p: { external_id: string }) => !deployableMap.get(p.external_id),
			);

			if (nonDeployable.length > 0) {
				const names = nonDeployable.map((p: { name: string }) => p.name).join(', ');
				throw new InvalidPayloadError({
					reason: `Cannot add non-deployable projects: ${names}`,
				});
			}

			await projectsService.createMany(
				value.create.map((p: { external_id: string; name: string }) => ({
					deployment: deployment.id,
					external_id: p.external_id,
					name: p.name,
				})),
			);
		}

		// Return updated selection
		const updatedProjects = await projectsService.readByQuery({
			filter: { deployment: { _eq: deployment.id } },
		});

		res.locals['payload'] = { data: updatedProjects };
		return next();
	}),
	respond,
);

// Dashboard - selected projects with full details + stats
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
			res.locals['payload'] = {
				data: {
					projects: [],
					stats: {
						activeDeployments: 0,
						failedBuilds: 0,
						successfulBuilds: 0,
					},
				},
			};

			return next();
		}

		// Fetch full details for each selected project (parallel)
		const driver = await service.getDriver(provider);

		const projectDetails = await Promise.all(
			selectedProjects.map(async (p) => {
				const details = await driver.getProject(p.external_id);

				return {
					id: p.id,
					external_id: p.external_id,
					name: details.name,
					url: details.url,
					framework: details.framework,
					deployable: details.deployable,
					latest_deployment: details.latest_deployment,
				};
			}),
		);

		// Calculate stats from latest deployments
		let activeDeployments = 0;
		let failedBuilds = 0;
		let successfulBuilds = 0;

		for (const project of projectDetails) {
			if (project.latest_deployment) {
				const status = project.latest_deployment.status;

				if (status === 'building' || status === 'queued') {
					activeDeployments++;
				} else if (status === 'error') {
					failedBuilds++;
				} else if (status === 'ready') {
					successfulBuilds++;
				}
			}
		}

		res.locals['payload'] = {
			data: {
				projects: projectDetails,
				stats: {
					activeDeployments,
					failedBuilds,
					successfulBuilds,
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
	clearCache: Joi.boolean().default(true), // Default at true (matches Vercel UI behavior)
});

router.post(
	'/:provider/projects/:id/deploy',
	asyncHandler(async (req, res, next) => {
		const provider = req.params['provider']!;
		const projectId = req.params['id']!; // internal UUID

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

		const service = new DeploymentService({
			accountability: req.accountability,
			schema: req.schema,
		});

		// Test connection if credentials are being updated
		if (req.body.credentials) {
			const existingConfig = await service.readByProvider(provider);
			const mergedOptions = { ...existingConfig.options, ...req.body.options };
			const driver = getDeploymentDriver(provider, req.body.credentials, mergedOptions);
			await driver.testConnection();
		}

		// Stringify JSON fields if present
		const data = { ...req.body };

		if (data.credentials && typeof data.credentials === 'object') {
			data.credentials = JSON.stringify(data.credentials);
		}

		if (data.options && typeof data.options === 'object') {
			data.options = JSON.stringify(data.options);
		}

		const primaryKey = await service.updateByProvider(provider, data);

		try {
			const item = await service.readOne(primaryKey, req.sanitizedQuery);
			res.locals['payload'] = { data: item || null };
		} catch (error: any) {
			if (isDirectusError(error, ErrorCode.Forbidden)) {
				return next();
			}

			throw error;
		}

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
		const provider = req.params['provider']!;
		const projectId = req.params['id']!;

		if (!validateProvider(provider)) {
			throw new InvalidPayloadError({ reason: `Invalid provider: ${provider}` });
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

		// Get runs from DB
		const runs = await runsService.readByQuery({
			filter: { project: { _eq: projectId } },
			sort: ['-date_created'],
		});

		res.locals['payload'] = { data: runs };
		return next();
	}),
	respond,
);

// Get single run details
// Query params:
// - since: ISO timestamp to filter logs (only return logs after this time)
router.get(
	'/:provider/runs/:id',
	asyncHandler(async (req, res, next) => {
		const provider = req.params['provider']!;
		const runId = req.params['id']!;
		const since = req.query['since'] as string | undefined;

		if (!validateProvider(provider)) {
			throw new InvalidPayloadError({ reason: `Invalid provider: ${provider}` });
		}

		// Validate since parameter if provided
		let sinceDate: Date | undefined;

		if (since) {
			sinceDate = new Date(since);

			if (isNaN(sinceDate.getTime())) {
				throw new InvalidPayloadError({ reason: 'Invalid "since" parameter. Must be a valid ISO timestamp.' });
			}
		}

		const runsService = new DeploymentRunsService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const service = new DeploymentService({
			accountability: req.accountability,
			schema: req.schema,
		});

		// Get run from DB
		const run = await runsService.readOne(runId);

		// Fetch latest status and logs from provider
		const driver = await service.getDriver(provider);

		const [details, logs] = await Promise.all([
			driver.getDeployment(run.external_id),
			driver.getDeploymentLogs(run.external_id, sinceDate ? { since: sinceDate } : undefined),
		]);

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

		// Get run from DB
		const run = await runsService.readOne(runId);

		// Cancel via provider
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
