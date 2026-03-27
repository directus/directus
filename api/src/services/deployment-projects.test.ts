import { InvalidPayloadError } from '@directus/errors';
import { SchemaBuilder } from '@directus/schema-builder';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { createMockKnex, resetKnexMocks } from '../test-utils/knex.js';
import { DeploymentProjectsService } from './deployment-projects.js';
import { ItemsService } from './items.js';

const { mockListProjects } = vi.hoisted(() => ({
	mockListProjects: vi.fn(),
}));

vi.mock('../deployment.js', () => ({
	getDeploymentDriver: vi.fn(() => ({
		listProjects: mockListProjects,
	})),
}));

vi.mock('../../src/database/index', async () => {
	const { mockDatabase } = await import('../test-utils/database.js');
	return mockDatabase();
});

const schema = new SchemaBuilder()
	.collection('directus_deployments', (c) => {
		c.field('id').uuid().primary();
		c.field('provider').string();
		c.field('credentials').text();
		c.field('options').text();
	})
	.collection('directus_deployment_projects', (c) => {
		c.field('id').uuid().primary();
		c.field('deployment').uuid();
		c.field('external_id').string();
		c.field('name').string();
		c.field('deployable').boolean();
	})
	.build();

const vercelConfig = {
	id: 'deploy-1',
	provider: 'vercel',
	credentials: JSON.stringify({ access_token: 'token' }),
	options: null,
};

describe('DeploymentProjectsService', () => {
	const { db, tracker, mockSchemaBuilder } = createMockKnex();

	afterEach(() => {
		resetKnexMocks(tracker, mockSchemaBuilder);
		vi.clearAllMocks();
	});

	describe('validateDeployable', () => {
		let service: DeploymentProjectsService;

		beforeEach(() => {
			service = new DeploymentProjectsService({
				knex: db,
				schema,
			});

			tracker.on.select('directus_deployments').response([vercelConfig]);
		});

		it('should skip validation when projectsToCreate is empty', async () => {
			await service.validateDeployable('vercel', []);

			expect(mockListProjects).not.toHaveBeenCalled();
		});

		it('should pass when all projects are deployable', async () => {
			mockListProjects.mockResolvedValueOnce([
				{ id: 'proj-1', name: 'Project 1', deployable: true },
				{ id: 'proj-2', name: 'Project 2', deployable: true },
			]);

			await expect(
				service.validateDeployable('vercel', [
					{ external_id: 'proj-1', name: 'Project 1' },
					{ external_id: 'proj-2', name: 'Project 2' },
				]),
			).resolves.toBeUndefined();
		});

		it('should throw InvalidPayloadError for non-deployable projects', async () => {
			mockListProjects.mockResolvedValueOnce([
				{ id: 'proj-1', name: 'Project 1', deployable: true },
				{ id: 'proj-2', name: 'Static Site', deployable: false },
			]);

			await expect(
				service.validateDeployable('vercel', [
					{ external_id: 'proj-1', name: 'Project 1' },
					{ external_id: 'proj-2', name: 'Static Site' },
				]),
			).rejects.toThrow(InvalidPayloadError);
		});

		it('should list all non-deployable project names in error', async () => {
			mockListProjects.mockResolvedValueOnce([
				{ id: 'proj-1', name: 'Site A', deployable: false },
				{ id: 'proj-2', name: 'Site B', deployable: false },
			]);

			await expect(
				service.validateDeployable('vercel', [
					{ external_id: 'proj-1', name: 'Site A' },
					{ external_id: 'proj-2', name: 'Site B' },
				]),
			).rejects.toThrow(/Site A, Site B/);
		});

		it('should throw when provider config is not found', async () => {
			vi.spyOn(ItemsService.prototype, 'readByQuery').mockResolvedValueOnce([]);

			await expect(service.validateDeployable('vercel', [{ external_id: 'proj-1', name: 'Test' }])).rejects.toThrow(
				'Deployment config for "vercel" not found',
			);
		});
	});
});
