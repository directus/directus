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

// Get single project from provider
router.get(
	'/:provider/projects/:projectId',
	asyncHandler(async (req, res, next) => {
		const provider = req.params['provider']!;
		const projectId = req.params['projectId']!;

		if (!validateProvider(provider)) {
			throw new InvalidPayloadError({ reason: `Invalid provider: ${provider}` });
		}

		const service = new DeploymentService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const driver = await service.getDriver(provider);
		const project = await driver.getProject(projectId);

		res.locals['payload'] = { data: project };
		return next();
	}),
	respond,
);

// Update selected projects (Directus-style with create/delete)
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
					latestDeployment: details.latestDeployment,
				};
			}),
		);

		// Calculate stats from latest deployments
		let activeDeployments = 0;
		let failedBuilds = 0;
		let successfulBuilds = 0;

		for (const project of projectDetails) {
			if (project.latestDeployment) {
				const status = project.latestDeployment.status;

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
	target: Joi.string().valid('production', 'preview').default('production'),
	clearCache: Joi.boolean().default(false),
});

router.post(
	'/:provider/projects/:projectId/deploy',
	asyncHandler(async (req, res, next) => {
		const provider = req.params['provider']!;
		const projectId = req.params['projectId']!; // internal UUID

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
		const result = await driver.triggerDeployment(project.external_id, value.target, value.clearCache);

		// Store run in DB
		const runId = await runsService.createOne({
			project: projectId,
			external_id: result.deploymentId,
			target: value.target,
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

export default router;
