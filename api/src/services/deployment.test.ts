import { InvalidPayloadError, InvalidProviderConfigError } from '@directus/errors';
import { SchemaBuilder } from '@directus/schema-builder';
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';
import { createMockKnex, resetKnexMocks } from '../test-utils/knex.js';
import { DeploymentService } from './deployment.js';
import { ItemsService } from './items.js';

const { mockTestConnection, mockListProjects, mockGetProject, mockGetCacheValueWithTTL, mockSetCacheValueWithExpiry } =
	vi.hoisted(() => ({
		mockTestConnection: vi.fn(),
		mockListProjects: vi.fn(),
		mockGetProject: vi.fn(),
		mockGetCacheValueWithTTL: vi.fn(),
		mockSetCacheValueWithExpiry: vi.fn(),
	}));

vi.mock('../deployment.js', () => ({
	getDeploymentDriver: vi.fn(() => ({
		testConnection: mockTestConnection,
		listProjects: mockListProjects,
		getProject: mockGetProject,
	})),
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

		it('should throw error when provider not found', async () => {
			vi.spyOn(ItemsService.prototype, 'readByQuery').mockResolvedValue([]);

			await expect(service.readByProvider('vercel')).rejects.toThrow('Deployment config for "vercel" not found');
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
});
