import {
	ForbiddenError,
	HitRateLimitError,
	InvalidCredentialsError,
	InvalidPayloadError,
	InvalidProviderConfigError,
} from '@directus/errors';
import { SchemaBuilder } from '@directus/schema-builder';
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';
import { createMockKnex, resetKnexMocks } from '../test-utils/knex.js';
import { DeploymentProjectsService } from './deployment-projects.js';
import { DeploymentRunsService } from './deployment-runs.js';
import { DeploymentService } from './deployment.js';
import { ItemsService } from './items.js';

const {
	mockDriver,
	mockTestConnection,
	mockListProjects,
	mockGetProject,
	mockGetRunLogs,
	mockGetRun,
	mockTriggerRun,
	mockCancelRun,
	mockRegisterWebhook,
	mockUnregisterWebhook,
	mockOnConfigCreated,
	mockOnConfigUpdated,
	mockOnConfigDeleted,
	mockGetCacheValueWithTTL,
	mockSetCacheValueWithExpiry,
	mockLoggerDebug,
	mockLoggerError,
	mockLoggerWarn,
} = vi.hoisted(() => ({
	mockDriver: {
		capabilities: {
			eventsTransport: 'webhook' as 'webhook' | 'poll',
			supportsPreviewDeploy: true,
			supportsDeployHookUrl: false,
			needsRunStatusPolling: false,
		},
		testConnection: vi.fn(),
		listProjects: vi.fn(),
		getProject: vi.fn(),
		getRunLogs: vi.fn(),
		getRun: vi.fn(),
		triggerRun: vi.fn(),
		cancelRun: vi.fn(),
		registerWebhook: vi.fn(),
		unregisterWebhook: vi.fn(),
		onConfigCreated: vi.fn(),
		onConfigUpdated: vi.fn(),
		onConfigDeleted: vi.fn(),
	},
	mockTestConnection: vi.fn(),
	mockListProjects: vi.fn(),
	mockGetProject: vi.fn(),
	mockGetRunLogs: vi.fn(),
	mockGetRun: vi.fn(),
	mockTriggerRun: vi.fn(),
	mockCancelRun: vi.fn(),
	mockRegisterWebhook: vi.fn(),
	mockUnregisterWebhook: vi.fn(),
	mockOnConfigCreated: vi.fn(),
	mockOnConfigUpdated: vi.fn(),
	mockOnConfigDeleted: vi.fn(),
	mockGetCacheValueWithTTL: vi.fn(),
	mockSetCacheValueWithExpiry: vi.fn(),
	mockLoggerDebug: vi.fn(),
	mockLoggerError: vi.fn(),
	mockLoggerWarn: vi.fn(),
}));

vi.mock('../deployment.js', () => ({
	getDeploymentDriver: vi.fn(() => mockDriver),
	buildDriverFromConfig: vi.fn(() => mockDriver),
	readDeploymentConfig: vi.fn(async (knex: unknown, schema: unknown, provider: string) => {
		const internalService = new ItemsService('directus_deployments', { knex, schema, accountability: null } as any);
		const results = await internalService.readByQuery({ filter: { provider: { _eq: provider } }, limit: 1 });

		if (!results || results.length === 0) {
			throw new ForbiddenError({ reason: `Deployment config for "${provider}" not found` });
		}

		return results[0];
	}),
}));

vi.mock('../cache.js', () => ({
	getCache: vi.fn(() => ({ deploymentCache: {} })),
	getCacheValueWithTTL: mockGetCacheValueWithTTL,
	setCacheValueWithExpiry: mockSetCacheValueWithExpiry,
}));

vi.mock('@directus/env', () => ({
	useEnv: vi.fn(() => ({
		CACHE_DEPLOYMENT_TTL: '5s',
	})),
}));

vi.mock('../logger/index.js', () => ({
	useLogger: vi.fn(() => ({
		debug: mockLoggerDebug,
		info: vi.fn(),
		error: mockLoggerError,
		warn: mockLoggerWarn,
	})),
}));

vi.mock('../../src/database/index', async () => {
	const { mockDatabase } = await import('../test-utils/database.js');
	return mockDatabase();
});

const schema = new SchemaBuilder()
	.collection('directus_deployments', (c) => {
		c.field('id').integer().primary();
		c.field('provider').string();
		c.field('credentials').text();
		c.field('options').text();
	})
	.build();

describe('DeploymentService', () => {
	const { db, tracker, mockSchemaBuilder } = createMockKnex();

	beforeEach(() => {
		mockDriver.capabilities = {
			eventsTransport: 'webhook',
			supportsPreviewDeploy: true,
			supportsDeployHookUrl: false,
			needsRunStatusPolling: false,
		};

		mockDriver.testConnection = mockTestConnection;
		mockDriver.listProjects = mockListProjects;
		mockDriver.getProject = mockGetProject;
		mockDriver.getRunLogs = mockGetRunLogs;
		mockDriver.getRun = mockGetRun;
		mockDriver.triggerRun = mockTriggerRun;
		mockDriver.cancelRun = mockCancelRun;
		mockDriver.registerWebhook = mockRegisterWebhook;
		mockDriver.unregisterWebhook = mockUnregisterWebhook;
		mockDriver.onConfigCreated = mockOnConfigCreated;
		mockDriver.onConfigUpdated = mockOnConfigUpdated;
		mockDriver.onConfigDeleted = mockOnConfigDeleted;
	});

	afterEach(() => {
		resetKnexMocks(tracker, mockSchemaBuilder);
		vi.clearAllMocks();
	});

	describe('createOne', () => {
		let service: DeploymentService;
		let superCreateOne: MockInstance;

		beforeEach(() => {
			service = new DeploymentService({
				knex: db,
				schema,
			});

			superCreateOne = vi.spyOn(ItemsService.prototype, 'createOne').mockResolvedValue(1);
			mockTestConnection.mockResolvedValue(undefined);
		});

		it('should throw InvalidPayloadError when provider is missing', async () => {
			await expect(
				service.createOne({
					credentials: { access_token: 'token' },
				}),
			).rejects.toThrow(InvalidPayloadError);

			expect(superCreateOne).not.toHaveBeenCalled();
		});

		it('should throw InvalidPayloadError when credentials are missing', async () => {
			await expect(
				service.createOne({
					provider: 'vercel',
				}),
			).rejects.toThrow(InvalidPayloadError);

			expect(superCreateOne).not.toHaveBeenCalled();
		});

		it('should throw InvalidPayloadError when credentials are empty', async () => {
			await expect(
				service.createOne({
					provider: 'vercel',
					credentials: {},
				}),
			).rejects.toThrow(InvalidPayloadError);

			expect(superCreateOne).not.toHaveBeenCalled();
		});

		it('should throw InvalidProviderConfigError when testConnection fails', async () => {
			mockTestConnection.mockRejectedValueOnce(new Error('Connection failed'));

			await expect(
				service.createOne({
					provider: 'vercel',
					credentials: { access_token: 'invalid-token' },
				}),
			).rejects.toThrow(InvalidProviderConfigError);

			expect(superCreateOne).not.toHaveBeenCalled();
		});

		it('should create deployment with valid credentials object', async () => {
			const credentials = { access_token: 'valid-token' };

			await service.createOne({
				provider: 'vercel',
				credentials,
			});

			expect(mockTestConnection).toHaveBeenCalled();

			expect(superCreateOne).toHaveBeenCalledWith(
				expect.objectContaining({
					provider: 'vercel',
					credentials: JSON.stringify(credentials),
				}),
				undefined,
			);
		});

		it('should create deployment with valid JSON string credentials', async () => {
			const credentials = { access_token: 'valid-token' };

			await service.createOne({
				provider: 'vercel',
				credentials: JSON.stringify(credentials) as any,
			});

			expect(mockTestConnection).toHaveBeenCalled();

			expect(superCreateOne).toHaveBeenCalledWith(
				expect.objectContaining({
					provider: 'vercel',
					credentials: JSON.stringify(credentials),
				}),
				undefined,
			);
		});

		it('should include options when provided', async () => {
			const credentials = { access_token: 'valid-token' };
			const options = { team_id: 'team-123' };

			await service.createOne({
				provider: 'vercel',
				credentials,
				options,
			});

			expect(superCreateOne).toHaveBeenCalledWith(
				expect.objectContaining({
					credentials: JSON.stringify(credentials),
					options: JSON.stringify(options),
				}),
				undefined,
			);
		});
	});

	describe('updateOne', () => {
		let service: DeploymentService;
		let superUpdateOne: MockInstance;

		const existingConfig = {
			id: 1,
			provider: 'vercel',
			credentials: JSON.stringify({ access_token: 'old-token' }),
			options: JSON.stringify({ team_id: 'old-team' }),
		};

		beforeEach(() => {
			service = new DeploymentService({
				knex: db,
				schema,
			});

			superUpdateOne = vi.spyOn(ItemsService.prototype, 'updateOne').mockResolvedValue(1);
			vi.spyOn(ItemsService.prototype, 'readOne').mockResolvedValue(existingConfig);
			mockTestConnection.mockResolvedValue(undefined);

			// Mock DB query for readConfig (internal readByQuery)
			tracker.on.select('directus_deployments').response([existingConfig]);
		});

		it('should skip validation when no credentials or options provided', async () => {
			await service.updateOne(1, { provider: 'vercel' });

			expect(mockTestConnection).not.toHaveBeenCalled();
			expect(superUpdateOne).toHaveBeenCalledWith(1, { provider: 'vercel' }, undefined);
		});

		it('should merge new credentials with existing ones', async () => {
			const newCredentials = { api_key: 'new-key' };

			await service.updateOne(1, { credentials: newCredentials });

			expect(mockTestConnection).toHaveBeenCalled();

			const expectedMerged = { access_token: 'old-token', api_key: 'new-key' };

			expect(superUpdateOne).toHaveBeenCalledWith(
				1,
				expect.objectContaining({
					credentials: JSON.stringify(expectedMerged),
				}),
				undefined,
			);
		});

		it('should replace options entirely (not merge)', async () => {
			const newOptions = { team_id: 'new-team' };

			await service.updateOne(1, { options: newOptions });

			expect(superUpdateOne).toHaveBeenCalledWith(
				1,
				expect.objectContaining({
					options: JSON.stringify(newOptions),
				}),
				undefined,
			);
		});

		it('should throw InvalidPayloadError when options is empty object', async () => {
			await expect(service.updateOne(1, { options: {} })).rejects.toThrow(InvalidPayloadError);

			expect(superUpdateOne).not.toHaveBeenCalled();
		});

		it('should throw InvalidProviderConfigError when testConnection fails', async () => {
			mockTestConnection.mockRejectedValueOnce(new Error('Invalid token'));

			await expect(service.updateOne(1, { credentials: { access_token: 'bad-token' } })).rejects.toThrow(
				InvalidProviderConfigError,
			);

			expect(superUpdateOne).not.toHaveBeenCalled();
		});
	});

	describe('readByProvider', () => {
		let service: DeploymentService;

		beforeEach(() => {
			service = new DeploymentService({
				knex: db,
				schema,
			});
		});

		it('should return config when provider exists', async () => {
			const config = { id: 1, provider: 'vercel', credentials: '{}' };

			vi.spyOn(ItemsService.prototype, 'readByQuery').mockResolvedValue([config]);

			const result = await service.readByProvider('vercel');

			expect(result).toEqual(config);
		});

		it('should throw ForbiddenError when provider not found', async () => {
			vi.spyOn(ItemsService.prototype, 'readByQuery').mockResolvedValue([]);

			await expect(service.readByProvider('vercel')).rejects.toThrow('Deployment config for "vercel" not found');

			try {
				await service.readByProvider('vercel');
				expect.unreachable();
			} catch (error) {
				expect(error).toBeInstanceOf(ForbiddenError);
			}
		});
	});

	describe('deleteByProvider', () => {
		let service: DeploymentService;
		let superDeleteOne: MockInstance;

		beforeEach(() => {
			service = new DeploymentService({
				knex: db,
				schema,
			});

			superDeleteOne = vi.spyOn(ItemsService.prototype, 'deleteOne').mockResolvedValue(1);
		});

		it('should delete config by provider', async () => {
			const config = { id: 1, provider: 'vercel' };

			vi.spyOn(ItemsService.prototype, 'readByQuery').mockResolvedValue([config]);

			await service.deleteByProvider('vercel');

			expect(superDeleteOne).toHaveBeenCalledWith(1);
		});

		it('should unregister the webhook before deleting the config row', async () => {
			const config = {
				id: 1,
				provider: 'vercel',
				webhook_ids: ['hook-1', 'hook-2'],
				credentials: '{}',
				options: '{}',
			};

			const callOrder: string[] = [];

			vi.spyOn(ItemsService.prototype, 'readByQuery').mockResolvedValue([config]);

			superDeleteOne.mockImplementation(async () => {
				callOrder.push('deleteOne');
				return 1;
			});

			mockUnregisterWebhook.mockImplementation(async () => {
				callOrder.push('unregisterWebhook');
			});

			await service.deleteByProvider('vercel');

			expect(mockUnregisterWebhook).toHaveBeenCalledWith(['hook-1', 'hook-2']);
			expect(callOrder).toEqual(['unregisterWebhook', 'deleteOne']);
		});

		it('should not fail the delete if unregistering the webhook throws', async () => {
			const config = { id: 1, provider: 'vercel', webhook_ids: ['hook-1'], credentials: '{}', options: '{}' };

			vi.spyOn(ItemsService.prototype, 'readByQuery').mockResolvedValue([config]);
			mockUnregisterWebhook.mockRejectedValueOnce(new Error('provider API down'));

			await expect(service.deleteByProvider('vercel')).resolves.toBe(1);

			expect(superDeleteOne).toHaveBeenCalledWith(1);

			expect(mockLoggerError).toHaveBeenCalledWith(
				new Error('provider API down'),
				expect.stringContaining('Failed to unregister webhook'),
			);
		});

		it('should call onConfigDeleted after the config row is deleted', async () => {
			const config = { id: 1, provider: 'cloudflare-workers', credentials: '{}', options: '{}' };

			vi.spyOn(ItemsService.prototype, 'readByQuery').mockResolvedValue([config]);

			await service.deleteByProvider('cloudflare-workers');

			expect(mockOnConfigDeleted).toHaveBeenCalledTimes(1);
		});

		it('should invoke onConfigDeleted with internal config when readByProvider returns redacted credentials', async () => {
			const redactedConfig = {
				id: 1,
				provider: 'cloudflare-workers',
				credentials: '**********',
				options: '{}',
			};

			const internalConfig = {
				id: 1,
				provider: 'cloudflare-workers',
				credentials: JSON.stringify({ api_token: 'secret' }),
				options: JSON.stringify({ account_id: 'acct-1' }),
			};

			vi.spyOn(ItemsService.prototype, 'readByQuery').mockResolvedValueOnce([redactedConfig]);
			vi.spyOn(service as any, 'readConfig').mockResolvedValueOnce(internalConfig);

			const deploymentModule = await import('../deployment.js');
			const buildDriverFromConfigSpy = vi.spyOn(deploymentModule, 'buildDriverFromConfig');

			await service.deleteByProvider('cloudflare-workers');

			expect(buildDriverFromConfigSpy).toHaveBeenCalledWith(internalConfig);
			expect(mockOnConfigDeleted).toHaveBeenCalledTimes(1);
		});
	});

	describe('syncWebhook', () => {
		let service: DeploymentService;

		const config = {
			id: 1,
			provider: 'vercel',
			credentials: JSON.stringify({ access_token: 'token' }),
			options: JSON.stringify({ team_id: 'team-1' }),
			webhook_ids: null as string[] | null,
		};

		beforeEach(() => {
			service = new DeploymentService({ knex: db, schema });
		});

		it('should early-return without touching the driver or DB for poll-based providers', async () => {
			mockDriver.capabilities = { ...mockDriver.capabilities, eventsTransport: 'poll' };
			const readByQuerySpy = vi.spyOn(ItemsService.prototype, 'readByQuery').mockResolvedValueOnce([config]);

			await service.syncWebhook('cloudflare-workers');

			// Only the one readByQuery from getDriverAndConfig — poll gate returns before registerWebhook.
			expect(readByQuerySpy).toHaveBeenCalledTimes(1);
			expect(mockRegisterWebhook).not.toHaveBeenCalled();
			expect(mockUnregisterWebhook).not.toHaveBeenCalled();
		});

		it('should clear legacy webhook_ids/webhook_secret for poll-based providers that still have them', async () => {
			const staleConfig = { ...config, webhook_ids: ['old-trigger-uuid'], webhook_secret: 'old-secret' };
			mockDriver.capabilities = { ...mockDriver.capabilities, eventsTransport: 'poll' };
			vi.spyOn(ItemsService.prototype, 'readByQuery').mockResolvedValueOnce([staleConfig]);
			const updateOneSpy = vi.spyOn(ItemsService.prototype, 'updateOne').mockResolvedValue(1);

			await service.syncWebhook('cloudflare-workers');

			expect(updateOneSpy).toHaveBeenCalledWith(1, { webhook_ids: null, webhook_secret: null });
			expect(mockRegisterWebhook).not.toHaveBeenCalled();
		});

		it('should register the webhook and persist the returned ids for webhook-based providers', async () => {
			vi.spyOn(ItemsService.prototype, 'readByQuery')
				.mockResolvedValueOnce([config]) // getDriverAndConfig() -> readConfig
				.mockResolvedValueOnce([{ external_id: 'proj-1' }]); // tracked projects

			const updateOneSpy = vi.spyOn(ItemsService.prototype, 'updateOne').mockResolvedValue(1);
			mockRegisterWebhook.mockResolvedValueOnce({ webhook_ids: ['hook-1'], webhook_secret: 'secret-1' });

			await service.syncWebhook('vercel');

			expect(mockRegisterWebhook).toHaveBeenCalledWith(expect.any(String), ['proj-1']);
			expect(updateOneSpy).toHaveBeenCalledWith(1, { webhook_ids: ['hook-1'], webhook_secret: 'secret-1' });
		});

		it('should roll back the newly-registered webhook and rethrow when persisting it fails', async () => {
			vi.spyOn(ItemsService.prototype, 'readByQuery')
				.mockResolvedValueOnce([config]) // getDriverAndConfig() -> readConfig
				.mockResolvedValueOnce([{ external_id: 'proj-1' }]); // tracked projects

			vi.spyOn(ItemsService.prototype, 'updateOne').mockRejectedValueOnce(new Error('DB connection lost'));
			mockRegisterWebhook.mockResolvedValueOnce({ webhook_ids: ['hook-1'], webhook_secret: 'secret-1' });

			await expect(service.syncWebhook('vercel')).rejects.toThrow('DB connection lost');

			expect(mockUnregisterWebhook).toHaveBeenCalledWith(['hook-1']);

			expect(mockLoggerError).toHaveBeenCalledWith(
				new Error('DB connection lost'),
				expect.stringContaining('Failed to persist newly-registered webhook(s) [hook-1]'),
			);
		});

		it('should still rethrow the original error and log when the rollback itself fails', async () => {
			vi.spyOn(ItemsService.prototype, 'readByQuery')
				.mockResolvedValueOnce([config]) // getDriverAndConfig() -> readConfig
				.mockResolvedValueOnce([{ external_id: 'proj-1' }]); // tracked projects

			vi.spyOn(ItemsService.prototype, 'updateOne').mockRejectedValueOnce(new Error('DB connection lost'));
			mockRegisterWebhook.mockResolvedValueOnce({ webhook_ids: ['hook-1'], webhook_secret: 'secret-1' });
			mockUnregisterWebhook.mockRejectedValueOnce(new Error('provider API down'));

			await expect(service.syncWebhook('vercel')).rejects.toThrow('DB connection lost');

			expect(mockLoggerError).toHaveBeenCalledWith(
				new Error('provider API down'),
				expect.stringContaining('Rollback failed — webhook(s) [hook-1] are orphaned'),
			);
		});

		it('should unregister and clear webhook_ids when no projects are tracked', async () => {
			const configWithWebhook = { ...config, webhook_ids: ['hook-1'] };

			vi.spyOn(ItemsService.prototype, 'readByQuery')
				.mockResolvedValueOnce([configWithWebhook]) // getDriverAndConfig() -> readConfig
				.mockResolvedValueOnce([]); // no tracked projects

			const updateOneSpy = vi.spyOn(ItemsService.prototype, 'updateOne').mockResolvedValue(1);

			await service.syncWebhook('vercel');

			expect(mockUnregisterWebhook).toHaveBeenCalledWith(['hook-1']);
			expect(updateOneSpy).toHaveBeenCalledWith(1, { webhook_ids: null, webhook_secret: null });
			expect(mockRegisterWebhook).not.toHaveBeenCalled();
		});
	});

	describe('listProviderProjects', () => {
		let service: DeploymentService;

		beforeEach(() => {
			service = new DeploymentService({
				knex: db,
				schema,
			});

			tracker.on
				.select('directus_deployments')
				.response([{ id: 1, provider: 'vercel', credentials: JSON.stringify({ access_token: 'token' }) }]);
		});

		it('should return cached data when available', async () => {
			const cachedProjects = [{ id: 'proj-1', name: 'Cached Project' }];

			mockGetCacheValueWithTTL.mockResolvedValueOnce({ data: cachedProjects, remainingTTL: 3000 });

			const result = await service.listProviderProjects('vercel');

			expect(result).toEqual({ data: cachedProjects, remainingTTL: 3000 });
			expect(mockListProjects).not.toHaveBeenCalled();
		});

		it('should fetch from driver and cache when cache miss', async () => {
			const projects = [{ id: 'proj-1', name: 'Fresh Project' }];

			mockGetCacheValueWithTTL.mockResolvedValueOnce(null);
			mockListProjects.mockResolvedValueOnce(projects);

			const result = await service.listProviderProjects('vercel');

			expect(mockListProjects).toHaveBeenCalled();
			expect(mockSetCacheValueWithExpiry).toHaveBeenCalledWith({}, 'vercel:projects', projects, expect.any(Number));
			expect(result.data).toEqual(projects);
		});
	});

	describe('getProviderProject', () => {
		let service: DeploymentService;

		beforeEach(() => {
			service = new DeploymentService({
				knex: db,
				schema,
			});

			tracker.on
				.select('directus_deployments')
				.response([{ id: 1, provider: 'vercel', credentials: JSON.stringify({ access_token: 'token' }) }]);
		});

		it('should return cached data when available', async () => {
			const cachedProject = { id: 'proj-1', name: 'Cached Project' };

			mockGetCacheValueWithTTL.mockResolvedValueOnce({ data: cachedProject, remainingTTL: 2000 });

			const result = await service.getProviderProject('vercel', 'proj-1');

			expect(result).toEqual({ data: cachedProject, remainingTTL: 2000 });
			expect(mockGetProject).not.toHaveBeenCalled();
		});

		it('should fetch from driver and cache when cache miss', async () => {
			const project = { id: 'proj-1', name: 'Fresh Project' };

			mockGetCacheValueWithTTL.mockResolvedValueOnce(null);
			mockGetProject.mockResolvedValueOnce(project);

			const result = await service.getProviderProject('vercel', 'proj-1');

			expect(mockGetProject).toHaveBeenCalledWith('proj-1');

			expect(mockSetCacheValueWithExpiry).toHaveBeenCalledWith(
				{},
				'vercel:project:proj-1',
				project,
				expect.any(Number),
			);

			expect(result.data).toEqual(project);
		});
	});

	describe('getDashboard / syncProjectMetadataIfStale', () => {
		let service: DeploymentService;

		const deployment = {
			id: 'deploy-1',
			provider: 'vercel',
			credentials: JSON.stringify({ access_token: 'token' }),
			options: null,
			last_synced_at: null as string | null,
		};

		const selectedProject = {
			id: 'sp-1',
			deployment: 'deploy-1',
			external_id: 'proj-1',
			name: 'My Project',
			url: 'https://example.com',
			framework: 'vuejs',
			deployable: true,
			date_created: '2024-01-01T00:00:00Z',
			user_created: 'user-1',
		};

		beforeEach(() => {
			service = new DeploymentService({
				knex: db,
				schema,
			});

			vi.spyOn(ItemsService.prototype, 'readByQuery').mockResolvedValue([deployment]);

			tracker.on.select('directus_deployments').response([deployment]);
		});

		it('should skip sync when last_synced_at is recent', async () => {
			const recentDeployment = { ...deployment, last_synced_at: new Date().toISOString() };

			vi.spyOn(ItemsService.prototype, 'readByQuery').mockResolvedValue([recentDeployment]);

			vi.spyOn(DeploymentProjectsService.prototype, 'readByQuery').mockResolvedValue([selectedProject]);
			vi.spyOn(DeploymentRunsService.prototype, 'readByQuery').mockResolvedValue([]);

			await service.getDashboard('vercel', new Date());

			// Wait for fire-and-forget
			await new Promise((resolve) => setTimeout(resolve, 0));

			expect(mockGetProject).not.toHaveBeenCalled();
		});

		it('should run sync when last_synced_at is null', async () => {
			vi.spyOn(DeploymentProjectsService.prototype, 'readByQuery').mockResolvedValue([selectedProject]);
			vi.spyOn(DeploymentRunsService.prototype, 'readByQuery').mockResolvedValue([]);
			vi.spyOn(DeploymentProjectsService.prototype, 'updateBatch').mockResolvedValue([]);
			vi.spyOn(ItemsService.prototype, 'updateOne').mockResolvedValue('deploy-1');

			mockGetProject.mockResolvedValueOnce({
				id: 'proj-1',
				name: 'Updated Name',
				url: 'https://new.com',
				framework: 'remix',
				deployable: true,
			});

			await service.getDashboard('vercel', new Date());
			await new Promise((resolve) => setTimeout(resolve, 0));

			expect(mockGetProject).toHaveBeenCalledWith('proj-1');
			expect(DeploymentProjectsService.prototype.updateBatch).toHaveBeenCalled();
		});

		it('should run sync when last_synced_at is stale', async () => {
			const staleDeployment = {
				...deployment,
				last_synced_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
			};

			vi.spyOn(ItemsService.prototype, 'readByQuery').mockResolvedValue([staleDeployment]);
			vi.spyOn(DeploymentProjectsService.prototype, 'readByQuery').mockResolvedValue([selectedProject]);
			vi.spyOn(DeploymentRunsService.prototype, 'readByQuery').mockResolvedValue([]);
			vi.spyOn(DeploymentProjectsService.prototype, 'updateBatch').mockResolvedValue([]);
			vi.spyOn(ItemsService.prototype, 'updateOne').mockResolvedValue('deploy-1');

			mockGetProject.mockResolvedValueOnce({
				id: 'proj-1',
				name: 'Updated',
				deployable: true,
			});

			await service.getDashboard('vercel', new Date());
			await new Promise((resolve) => setTimeout(resolve, 0));

			expect(mockGetProject).toHaveBeenCalledWith('proj-1');
		});

		it('should not crash getDashboard if sync fails', async () => {
			vi.spyOn(DeploymentProjectsService.prototype, 'readByQuery').mockResolvedValue([selectedProject]);
			vi.spyOn(DeploymentRunsService.prototype, 'readByQuery').mockResolvedValue([]);

			mockGetProject.mockRejectedValueOnce(new Error('API down'));

			const result = await service.getDashboard('vercel', new Date());
			await new Promise((resolve) => setTimeout(resolve, 0));

			expect(result.projects).toHaveLength(1);
			expect(mockLoggerError).toHaveBeenCalled();
		});

		it('should refresh a non-terminal latest run for poll-based providers', async () => {
			mockDriver.capabilities = {
				eventsTransport: 'poll',
				supportsPreviewDeploy: false,
				supportsDeployHookUrl: true,
				needsRunStatusPolling: true,
			};

			const projectWithBuildingRun = {
				...selectedProject,
				runs: [
					{
						id: 'run-1',
						project: 'sp-1',
						external_id: 'build-123',
						target: 'production',
						status: 'building',
						url: null,
						started_at: '2026-01-01T00:00:00Z',
						completed_at: null,
						date_created: '2026-01-01T00:00:00Z',
						user_created: 'user-1',
					},
				],
			};

			const recentDeployment = { ...deployment, last_synced_at: new Date().toISOString() };

			vi.spyOn(ItemsService.prototype, 'readByQuery').mockResolvedValue([recentDeployment]);
			vi.spyOn(DeploymentProjectsService.prototype, 'readByQuery').mockResolvedValue([projectWithBuildingRun]);
			vi.spyOn(DeploymentRunsService.prototype, 'readByQuery').mockResolvedValue([]);
			vi.spyOn(DeploymentRunsService.prototype, 'updateOne').mockResolvedValue('run-1');

			mockGetRun.mockResolvedValueOnce({
				id: 'build-123',
				project_id: 'proj-1',
				status: 'ready',
				url: 'https://example.com',
				created_at: new Date(),
			});

			const result = await service.getDashboard('vercel', new Date());
			await new Promise((resolve) => setTimeout(resolve, 0));

			expect(mockGetRun).toHaveBeenCalledWith('build-123');
			expect(result.projects[0]?.['latest_deployment']?.status).toBe('ready');
		});

		it('should not poll run status for webhook-based providers', async () => {
			const projectWithBuildingRun = {
				...selectedProject,
				runs: [
					{
						id: 'run-1',
						project: 'sp-1',
						external_id: 'build-123',
						target: 'production',
						status: 'building',
						url: null,
						started_at: '2026-01-01T00:00:00Z',
						completed_at: null,
						date_created: '2026-01-01T00:00:00Z',
						user_created: 'user-1',
					},
				],
			};

			const recentDeployment = { ...deployment, last_synced_at: new Date().toISOString() };

			vi.spyOn(ItemsService.prototype, 'readByQuery').mockResolvedValue([recentDeployment]);
			vi.spyOn(DeploymentProjectsService.prototype, 'readByQuery').mockResolvedValue([projectWithBuildingRun]);
			vi.spyOn(DeploymentRunsService.prototype, 'readByQuery').mockResolvedValue([]);

			const result = await service.getDashboard('vercel', new Date());
			await new Promise((resolve) => setTimeout(resolve, 0));

			expect(mockGetRun).not.toHaveBeenCalled();
			expect(result.projects[0]?.['latest_deployment']?.status).toBe('building');
		});
	});

	describe('getDriver / getRunWithLogs', () => {
		let service: DeploymentService;

		const deployment = {
			id: 1,
			provider: 'cloudflare-workers',
			credentials: JSON.stringify({ api_token: 'token' }),
			options: JSON.stringify({ account_id: 'account-123' }),
			webhook_ids: ['trigger-123'],
		};

		beforeEach(() => {
			service = new DeploymentService({
				knex: db,
				schema,
			});

			vi.spyOn(service as any, 'readConfig').mockResolvedValue(deployment);
		});

		it('should build the driver from the config returned by readConfig, unmodified', async () => {
			const deploymentModule = await import('../deployment.js');
			const buildDriverFromConfigSpy = vi.spyOn(deploymentModule, 'buildDriverFromConfig');

			await service.getDriver('cloudflare-workers');

			expect(buildDriverFromConfigSpy).toHaveBeenCalledWith(deployment);
		});

		it('should refresh non-webhook run status in getRunWithLogs', async () => {
			mockDriver.capabilities = {
				eventsTransport: 'poll',
				supportsPreviewDeploy: false,
				supportsDeployHookUrl: true,
				needsRunStatusPolling: true,
			};

			mockGetRun.mockResolvedValueOnce({
				id: 'build-1',
				project_id: 'worker-1',
				status: 'ready',
				url: 'https://example.com',
				created_at: new Date(),
				logs: [{ type: 'info', message: 'Build started', timestamp: new Date() }],
			});

			vi.spyOn(DeploymentRunsService.prototype, 'readOne').mockResolvedValue({
				id: 'run-1',
				project: 'project-1',
				external_id: 'build-1',
				status: 'building',
				target: 'production',
				date_created: '2026-01-01T00:00:00.000Z',
				url: null,
				started_at: '2026-01-01T00:00:00.000Z',
				completed_at: null,
			} as any);

			const updateSpy = vi.spyOn(DeploymentRunsService.prototype, 'updateOne').mockResolvedValue('run-1');

			const result = await service.getRunWithLogs('cloudflare-workers', 'run-1');

			expect(updateSpy).toHaveBeenCalledWith(
				'run-1',
				expect.objectContaining({
					status: 'ready',
					url: 'https://example.com',
				}),
			);

			expect(result.status).toBe('ready');
			expect(result.logs).toHaveLength(1);
		});

		it('should skip refresh for webhook providers in getRunWithLogs', async () => {
			mockDriver.capabilities = {
				eventsTransport: 'webhook',
				supportsPreviewDeploy: true,
				supportsDeployHookUrl: false,
				needsRunStatusPolling: false,
			};

			mockGetRunLogs.mockResolvedValueOnce([{ type: 'info', message: 'Build started', timestamp: new Date() }]);

			vi.spyOn(DeploymentRunsService.prototype, 'readOne').mockResolvedValue({
				id: 'run-1',
				project: 'project-1',
				external_id: 'build-1',
				status: 'building',
				target: 'production',
				date_created: '2026-01-01T00:00:00.000Z',
				url: null,
				started_at: '2026-01-01T00:00:00.000Z',
				completed_at: null,
			} as any);

			const updateSpy = vi.spyOn(DeploymentRunsService.prototype, 'updateOne').mockResolvedValue('run-1');

			await service.getRunWithLogs('vercel', 'run-1');

			expect(updateSpy).not.toHaveBeenCalled();
			expect(mockGetRun).not.toHaveBeenCalled();
		});

		it('should leave the run unchanged and return empty logs when getRun throws during polling', async () => {
			mockDriver.capabilities = {
				eventsTransport: 'poll',
				supportsPreviewDeploy: false,
				supportsDeployHookUrl: true,
				needsRunStatusPolling: true,
			};

			mockGetRun.mockRejectedValueOnce(new Error('API down'));

			vi.spyOn(DeploymentRunsService.prototype, 'readOne').mockResolvedValue({
				id: 'run-1',
				project: 'project-1',
				external_id: 'build-1',
				status: 'building',
				target: 'production',
				date_created: '2026-01-01T00:00:00.000Z',
				url: null,
				started_at: null,
				completed_at: null,
			} as any);

			const updateSpy = vi.spyOn(DeploymentRunsService.prototype, 'updateOne').mockResolvedValue('run-1');

			const result = await service.getRunWithLogs('cloudflare-workers', 'run-1');

			expect(result.status).toBe('building');
			expect(result.logs).toEqual([]);
			expect(updateSpy).not.toHaveBeenCalled();
		});

		it('should rethrow InvalidCredentialsError from getRun during polling instead of masking it', async () => {
			mockDriver.capabilities = {
				eventsTransport: 'poll',
				supportsPreviewDeploy: false,
				supportsDeployHookUrl: true,
				needsRunStatusPolling: true,
			};

			mockGetRun.mockRejectedValueOnce(new InvalidCredentialsError());

			vi.spyOn(DeploymentRunsService.prototype, 'readOne').mockResolvedValue({
				id: 'run-1',
				project: 'project-1',
				external_id: 'build-1',
				status: 'building',
				target: 'production',
				date_created: '2026-01-01T00:00:00.000Z',
				url: null,
				started_at: null,
				completed_at: null,
			} as any);

			await expect(service.getRunWithLogs('cloudflare-workers', 'run-1')).rejects.toBeInstanceOf(
				InvalidCredentialsError,
			);
		});

		it('should rethrow HitRateLimitError from getRun during polling instead of masking it', async () => {
			mockDriver.capabilities = {
				eventsTransport: 'poll',
				supportsPreviewDeploy: false,
				supportsDeployHookUrl: true,
				needsRunStatusPolling: true,
			};

			mockGetRun.mockRejectedValueOnce(new HitRateLimitError({ limit: 100, reset: new Date() }));

			vi.spyOn(DeploymentRunsService.prototype, 'readOne').mockResolvedValue({
				id: 'run-1',
				project: 'project-1',
				external_id: 'build-1',
				status: 'building',
				target: 'production',
				date_created: '2026-01-01T00:00:00.000Z',
				url: null,
				started_at: null,
				completed_at: null,
			} as any);

			await expect(service.getRunWithLogs('cloudflare-workers', 'run-1')).rejects.toBeInstanceOf(HitRateLimitError);
		});

		it('should skip polling for already-terminal runs and fall through to getRunLogs', async () => {
			mockDriver.capabilities = {
				eventsTransport: 'poll',
				supportsPreviewDeploy: false,
				supportsDeployHookUrl: true,
				needsRunStatusPolling: true,
			};

			mockGetRunLogs.mockResolvedValueOnce([{ type: 'info', message: 'Done', timestamp: new Date() }]);

			vi.spyOn(DeploymentRunsService.prototype, 'readOne').mockResolvedValue({
				id: 'run-1',
				project: 'project-1',
				external_id: 'build-1',
				status: 'ready',
				target: 'production',
				date_created: '2026-01-01T00:00:00.000Z',
				url: 'https://example.com',
				started_at: null,
				completed_at: '2026-01-01T00:05:00.000Z',
			} as any);

			const result = await service.getRunWithLogs('cloudflare-workers', 'run-1');

			expect(mockGetRun).not.toHaveBeenCalled();
			expect(result.logs).toHaveLength(1);
		});

		it('should return empty logs when getRunLogs throws for webhook provider', async () => {
			mockDriver.capabilities = {
				eventsTransport: 'webhook',
				supportsPreviewDeploy: true,
				supportsDeployHookUrl: false,
				needsRunStatusPolling: false,
			};

			mockGetRunLogs.mockRejectedValueOnce(new Error('Logs API down'));

			vi.spyOn(DeploymentRunsService.prototype, 'readOne').mockResolvedValue({
				id: 'run-1',
				project: 'project-1',
				external_id: 'build-1',
				status: 'building',
				target: 'production',
				date_created: '2026-01-01T00:00:00.000Z',
				url: null,
				started_at: null,
				completed_at: null,
			} as any);

			const result = await service.getRunWithLogs('vercel', 'run-1');

			expect(result.logs).toEqual([]);
		});

		it('should rethrow InvalidCredentialsError from getRunLogs instead of masking it as empty logs', async () => {
			mockDriver.capabilities = {
				eventsTransport: 'webhook',
				supportsPreviewDeploy: true,
				supportsDeployHookUrl: false,
				needsRunStatusPolling: false,
			};

			mockGetRunLogs.mockRejectedValueOnce(new InvalidCredentialsError());

			vi.spyOn(DeploymentRunsService.prototype, 'readOne').mockResolvedValue({
				id: 'run-1',
				project: 'project-1',
				external_id: 'build-1',
				status: 'building',
				target: 'production',
				date_created: '2026-01-01T00:00:00.000Z',
				url: null,
				started_at: null,
				completed_at: null,
			} as any);

			await expect(service.getRunWithLogs('vercel', 'run-1')).rejects.toBeInstanceOf(InvalidCredentialsError);
		});
	});

	describe('triggerDeployment', () => {
		let service: DeploymentService;

		const project = {
			id: 'project-1',
			external_id: 'worker-tag-1',
			name: 'My Worker',
			deployable: true,
		};

		const deployment = {
			id: 'deploy-1',
			provider: 'cloudflare-workers',
			credentials: JSON.stringify({ api_token: 'token' }),
			options: JSON.stringify({ account_id: 'account-1' }),
			webhook_ids: null,
		};

		beforeEach(() => {
			service = new DeploymentService({ knex: db, schema });

			mockDriver.capabilities = {
				eventsTransport: 'poll',
				supportsPreviewDeploy: false,
				supportsDeployHookUrl: true,
				needsRunStatusPolling: true,
			};

			vi.spyOn(service, 'getDriver').mockResolvedValue(mockDriver as any);
			vi.spyOn(service as any, 'readConfig').mockResolvedValue(deployment);
			vi.spyOn(DeploymentProjectsService.prototype, 'readOne').mockResolvedValue(project as any);
			vi.spyOn(DeploymentRunsService.prototype, 'createOne').mockResolvedValue('run-1');

			vi.spyOn(DeploymentRunsService.prototype, 'readOne').mockResolvedValue({
				id: 'run-1',
				external_id: 'build-123',
				status: 'building',
				project: 'project-1',
				target: 'production',
				date_created: '2026-01-01T00:00:00.000Z',
			} as any);

			mockTriggerRun.mockResolvedValue({
				deployment_id: 'build-123',
				status: 'building',
				created_at: new Date('2026-01-01T00:00:00.000Z'),
			});
		});

		it('should trigger a production deployment and store the run', async () => {
			const result = await service.triggerDeployment('cloudflare-workers', 'project-1', {
				preview: false,
				clearCache: false,
			});

			expect(mockTriggerRun).toHaveBeenCalledWith(
				'worker-tag-1',
				expect.objectContaining({ preview: false, clearCache: false }),
			);

			expect(DeploymentRunsService.prototype.createOne).toHaveBeenCalledWith(
				expect.objectContaining({ external_id: 'build-123', status: 'building' }),
			);

			expect(result).toBeDefined();
		});

		it('should throw InvalidPayloadError when preview is not supported', async () => {
			await expect(
				service.triggerDeployment('cloudflare-workers', 'project-1', { preview: true, clearCache: false }),
			).rejects.toThrow(InvalidPayloadError);

			expect(mockTriggerRun).not.toHaveBeenCalled();
		});

		it('should throw InvalidPayloadError when deploy hook is not supported', async () => {
			mockDriver.capabilities = { ...mockDriver.capabilities, supportsDeployHookUrl: false };

			await expect(
				service.triggerDeployment('cloudflare-workers', 'project-1', {
					preview: false,
					clearCache: false,
					deployHookUrl: 'https://example.com/hook',
				}),
			).rejects.toThrow(InvalidPayloadError);
		});

		it('should use hook: target when a deploy hook URL is provided', async () => {
			mockTriggerRun.mockResolvedValue({
				deployment_id: 'hook-build-1',
				status: 'building',
				created_at: new Date(),
			});

			await service.triggerDeployment('cloudflare-workers', 'project-1', {
				preview: false,
				clearCache: false,
				deployHookUrl: 'https://example.com/hook',
			});

			expect(DeploymentRunsService.prototype.createOne).toHaveBeenCalledWith(
				expect.objectContaining({ target: expect.stringContaining('hook:') }),
			);
		});

		it('should propagate InvalidProviderConfigError from a poll-based provider immediately, without retrying', async () => {
			mockTriggerRun.mockRejectedValueOnce(
				new InvalidProviderConfigError({
					provider: 'cloudflare-workers',
					reason: 'This Worker has no build trigger configured',
				}),
			);

			await expect(
				service.triggerDeployment('cloudflare-workers', 'project-1', { preview: false, clearCache: false }),
			).rejects.toThrow(InvalidProviderConfigError);

			// triggerRun already resolves trigger config live against the provider's API on every
			// call — there's no cached copy to refresh, so a retry can't help.
			expect(mockTriggerRun).toHaveBeenCalledTimes(1);
		});

		it('should propagate non-config errors immediately as well', async () => {
			mockTriggerRun.mockRejectedValueOnce(new Error('network blip'));

			await expect(
				service.triggerDeployment('cloudflare-workers', 'project-1', { preview: false, clearCache: false }),
			).rejects.toThrow('network blip');

			expect(mockTriggerRun).toHaveBeenCalledTimes(1);
		});
	});

	describe('cancelDeployment', () => {
		let service: DeploymentService;

		beforeEach(() => {
			service = new DeploymentService({ knex: db, schema });

			vi.spyOn(service, 'getDriver').mockResolvedValue(mockDriver as any);

			mockCancelRun.mockResolvedValue('canceled');

			vi.spyOn(DeploymentRunsService.prototype, 'readOne')
				.mockResolvedValueOnce({ id: 'run-1', external_id: 'build-123', status: 'building' } as any)
				.mockResolvedValueOnce({ id: 'run-1', external_id: 'build-123', status: 'canceled' } as any);

			vi.spyOn(DeploymentRunsService.prototype, 'updateOne').mockResolvedValue('run-1');
		});

		it('should call cancelRun and persist the updated status', async () => {
			const result = await service.cancelDeployment('cloudflare-workers', 'run-1');

			expect(mockCancelRun).toHaveBeenCalledWith('build-123');

			expect(DeploymentRunsService.prototype.updateOne).toHaveBeenCalledWith('run-1', { status: 'canceled' });

			expect(result.status).toBe('canceled');
		});
	});

	describe('refreshRunsStatuses', () => {
		let service: DeploymentService;

		const buildingRun = {
			id: 'run-1',
			project: 'project-1',
			external_id: 'build-123',
			status: 'building',
			target: 'production',
			date_created: '2026-01-01T00:00:00.000Z',
			url: null,
			started_at: null,
			completed_at: null,
		};

		beforeEach(() => {
			service = new DeploymentService({ knex: db, schema });

			mockDriver.capabilities = {
				eventsTransport: 'poll',
				supportsPreviewDeploy: false,
				supportsDeployHookUrl: true,
				needsRunStatusPolling: true,
			};

			vi.spyOn(service, 'getDriver').mockResolvedValue(mockDriver as any);
			vi.spyOn(DeploymentRunsService.prototype, 'updateOne').mockResolvedValue('run-1');
		});

		it('should return empty array immediately without calling the driver', async () => {
			const result = await service.refreshRunsStatuses('cloudflare-workers', []);
			expect(result).toEqual([]);
			expect(mockGetRun).not.toHaveBeenCalled();
		});

		it('should return runs unchanged when needsRunStatusPolling is false', async () => {
			mockDriver.capabilities = { ...mockDriver.capabilities, needsRunStatusPolling: false };

			const result = await service.refreshRunsStatuses('cloudflare-workers', [buildingRun as any]);

			expect(mockGetRun).not.toHaveBeenCalled();
			expect(result).toEqual([buildingRun]);
		});

		it('should skip already-terminal runs', async () => {
			const doneRun = { ...buildingRun, status: 'ready' };
			const result = await service.refreshRunsStatuses('cloudflare-workers', [doneRun as any]);

			expect(mockGetRun).not.toHaveBeenCalled();
			expect(result[0]?.status).toBe('ready');
		});

		it('should update status when a building run becomes ready', async () => {
			mockGetRun.mockResolvedValueOnce({
				id: 'build-123',
				project_id: 'project-1',
				status: 'ready',
				url: 'https://example.com',
				created_at: new Date(),
			});

			const result = await service.refreshRunsStatuses('cloudflare-workers', [buildingRun as any]);

			expect(DeploymentRunsService.prototype.updateOne).toHaveBeenCalledWith(
				'run-1',
				expect.objectContaining({ status: 'ready', url: 'https://example.com' }),
			);

			expect(result[0]?.status).toBe('ready');
		});

		it('should leave the run unchanged and log at debug when getRun throws', async () => {
			mockGetRun.mockRejectedValueOnce(new Error('API down'));

			const result = await service.refreshRunsStatuses('cloudflare-workers', [buildingRun as any]);

			expect(result[0]?.status).toBe('building');
			expect(DeploymentRunsService.prototype.updateOne).not.toHaveBeenCalled();

			expect(mockLoggerDebug).toHaveBeenCalledWith(
				new Error('API down'),
				expect.stringContaining('Failed to poll run "build-123" status'),
			);
		});

		it('should leave the run unchanged when getRun throws InvalidCredentialsError', async () => {
			mockGetRun.mockRejectedValueOnce(new InvalidCredentialsError());

			const result = await service.refreshRunsStatuses('cloudflare-workers', [buildingRun as any]);

			expect(result[0]?.status).toBe('building');
			expect(DeploymentRunsService.prototype.updateOne).not.toHaveBeenCalled();
		});
	});
});
