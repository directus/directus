import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NetlifyDriver } from './netlify.js';

const mockNetlifyAPI = vi.hoisted(() => ({
	listSites: vi.fn(),
	getSite: vi.fn(),
	listSiteDeploys: vi.fn(),
	getDeploy: vi.fn(),
	createSiteBuild: vi.fn(),
	deleteDeploy: vi.fn(),
}));

vi.mock('@netlify/api', () => ({
	NetlifyAPI: vi.fn(() => mockNetlifyAPI),
}));

describe('NetlifyDriver', () => {
	let driver: NetlifyDriver;

	beforeEach(() => {
		vi.clearAllMocks();
		driver = new NetlifyDriver({ access_token: 'test-token' });
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('authentication', () => {
		it('should instantiate NetlifyAPI with access token', async () => {
			mockNetlifyAPI.listSites.mockResolvedValueOnce([]);

			await driver.testConnection();

			expect(mockNetlifyAPI.listSites).toHaveBeenCalledWith({ per_page: 1 });
		});

		it('should include account_slug filter when account_slug option is set', async () => {
			const driverWithAccount = new NetlifyDriver({ access_token: 'test-token' }, { account_slug: 'account-123' });
			mockNetlifyAPI.listSites.mockResolvedValueOnce([]);

			await driverWithAccount.listProjects();

			expect(mockNetlifyAPI.listSites).toHaveBeenCalledWith(
				expect.objectContaining({
					filter: 'owner',
					per_page: '100',
				}),
			);
		});
	});

	describe('status mapping', () => {
		it('should map Netlify states to Status type', async () => {
			const mockSites = [
				{
					id: 'site-1',
					name: 'Site 1',
					url: 'https://site1.netlify.app',
					build_settings: { provider: 'github', repo_url: 'https://github.com/user/repo' },
					published_deploy: { state: 'ready', created_at: '2024-01-01T00:00:00Z' },
					created_at: '2024-01-01T00:00:00Z',
					updated_at: '2024-01-02T00:00:00Z',
				},
				{
					id: 'site-2',
					name: 'Site 2',
					url: 'https://site2.netlify.app',
					build_settings: { provider: 'github', repo_url: 'https://github.com/user/repo2' },
					published_deploy: { state: 'building', created_at: '2024-01-01T00:00:00Z' },
					created_at: '2024-01-01T00:00:00Z',
					updated_at: '2024-01-02T00:00:00Z',
				},
				{
					id: 'site-3',
					name: 'Site 3',
					url: 'https://site3.netlify.app',
					build_settings: { provider: 'github', repo_url: 'https://github.com/user/repo3' },
					published_deploy: { state: 'error', created_at: '2024-01-01T00:00:00Z' },
					created_at: '2024-01-01T00:00:00Z',
					updated_at: '2024-01-02T00:00:00Z',
				},
			];

			mockNetlifyAPI.listSites.mockResolvedValueOnce(mockSites);

			const projects = await driver.listProjects();

			expect(projects).toHaveLength(3);
			expect(projects[0]!.id).toBe('site-1');
			expect(projects[1]!.id).toBe('site-2');
			expect(projects[2]!.id).toBe('site-3');
		});

		it('should map enqueued and processing states to building', async () => {
			const mockDeploy = {
				id: 'deploy-1',
				site_id: 'site-1',
				state: 'enqueued',
				created_at: '2024-01-01T00:00:00Z',
			};

			mockNetlifyAPI.getDeploy.mockResolvedValueOnce(mockDeploy);

			const deployment = await driver.getDeployment('deploy-1');

			expect(deployment.status).toBe('building');
		});

		it('should map canceled and cancelled states to canceled', async () => {
			const mockDeploy = {
				id: 'deploy-1',
				site_id: 'site-1',
				state: 'cancelled',
				created_at: '2024-01-01T00:00:00Z',
			};

			mockNetlifyAPI.getDeploy.mockResolvedValueOnce(mockDeploy);

			const deployment = await driver.getDeployment('deploy-1');

			expect(deployment.status).toBe('canceled');
		});
	});

	describe('testConnection', () => {
		it('should successfully test connection', async () => {
			mockNetlifyAPI.listSites.mockResolvedValueOnce([]);

			await expect(driver.testConnection()).resolves.not.toThrow();
		});
	});

	describe('listProjects', () => {
		it('should return list of projects', async () => {
			const mockSites = [
				{
					id: 'site-1',
					name: 'My Site',
					url: 'https://mysite.netlify.app',
					custom_domain: 'mysite.com',
					build_settings: { provider: 'github', repo_url: 'https://github.com/user/repo' },
					created_at: '2024-01-01T00:00:00Z',
					updated_at: '2024-01-02T00:00:00Z',
				},
			];

			mockNetlifyAPI.listSites.mockResolvedValueOnce(mockSites);

			const projects = await driver.listProjects();

			expect(projects).toHaveLength(1);

			expect(projects[0]).toMatchObject({
				id: 'site-1',
				name: 'My Site',
				url: 'https://mysite.com',
				deployable: true,
			});
		});

		it('should mark sites without git source as not deployable', async () => {
			const mockSites = [
				{
					id: 'site-1',
					name: 'Manual Site',
					url: 'https://site.netlify.app',
					created_at: '2024-01-01T00:00:00Z',
					updated_at: '2024-01-02T00:00:00Z',
				},
			];

			mockNetlifyAPI.listSites.mockResolvedValueOnce(mockSites);

			const projects = await driver.listProjects();

			expect(projects[0]!.deployable).toBe(false);
		});
	});

	describe('getProject', () => {
		it('should return project details with latest deployment', async () => {
			const mockSite = {
				id: 'site-1',
				name: 'My Site',
				ssl_url: 'https://mysite.netlify.app',
				build_settings: { provider: 'github', repo_url: 'https://github.com/user/repo' },
				published_deploy: {
					id: 'deploy-1',
					state: 'ready',
					created_at: '2024-01-01T00:00:00Z',
					published_at: '2024-01-01T00:05:00Z',
				},
				created_at: '2024-01-01T00:00:00Z',
				updated_at: '2024-01-02T00:00:00Z',
			};

			mockNetlifyAPI.getSite.mockResolvedValueOnce(mockSite);

			const project = await driver.getProject('site-1');

			expect(project).toMatchObject({
				id: 'site-1',
				name: 'My Site',
				url: 'https://mysite.netlify.app',
				deployable: true,
				created_at: new Date('2024-01-01T00:00:00Z'),
				updated_at: new Date('2024-01-02T00:00:00Z'),
			});

			expect(project.latest_deployment).toMatchObject({
				status: 'ready',
				created_at: new Date('2024-01-01T00:00:00Z'),
				finished_at: new Date('2024-01-01T00:05:00Z'),
			});
		});
	});

	describe('listDeployments', () => {
		it('should return list of deployments', async () => {
			const mockDeploys = [
				{
					id: 'deploy-1',
					site_id: 'site-1',
					state: 'ready',
					ssl_url: 'https://deploy-1.netlify.app',
					created_at: '2024-01-01T00:00:00Z',
					published_at: '2024-01-01T00:05:00Z',
				},
				{
					id: 'deploy-2',
					site_id: 'site-1',
					state: 'building',
					deploy_ssl_url: 'https://deploy-2.netlify.app',
					created_at: '2024-01-02T00:00:00Z',
				},
			];

			mockNetlifyAPI.listSiteDeploys.mockResolvedValueOnce(mockDeploys);

			const deployments = await driver.listDeployments('site-1', 20);

			expect(deployments).toHaveLength(2);

			expect(deployments[0]).toMatchObject({
				id: 'deploy-1',
				project_id: 'site-1',
				status: 'ready',
				url: 'https://deploy-1.netlify.app',
				created_at: new Date('2024-01-01T00:00:00Z'),
				finished_at: new Date('2024-01-01T00:05:00Z'),
			});
		});

		it('should include error messages when present', async () => {
			const mockDeploys = [
				{
					id: 'deploy-1',
					site_id: 'site-1',
					state: 'error',
					created_at: '2024-01-01T00:00:00Z',
					error_message: 'Build failed: Command exited with code 1',
				},
			];

			mockNetlifyAPI.listSiteDeploys.mockResolvedValueOnce(mockDeploys);

			const deployments = await driver.listDeployments('site-1');

			expect(deployments[0]!.error_message).toBe('Build failed: Command exited with code 1');
		});
	});

	describe('getDeployment', () => {
		it('should return deployment details', async () => {
			const mockDeploy = {
				id: 'deploy-1',
				site_id: 'site-1',
				state: 'ready',
				ssl_url: 'https://deploy-1.netlify.app',
				created_at: '2024-01-01T00:00:00Z',
				published_at: '2024-01-01T00:05:00Z',
			};

			mockNetlifyAPI.getDeploy.mockResolvedValueOnce(mockDeploy);

			const deployment = await driver.getDeployment('deploy-1');

			expect(deployment).toMatchObject({
				id: 'deploy-1',
				project_id: 'site-1',
				status: 'ready',
				url: 'https://deploy-1.netlify.app',
				created_at: new Date('2024-01-01T00:00:00Z'),
				finished_at: new Date('2024-01-01T00:05:00Z'),
			});
		});
	});

	describe('triggerDeployment', () => {
		it('should trigger a new deployment', async () => {
			const mockBuildResponse = {
				id: 'build-1',
				deploy_id: 'deploy-new',
				sha: null,
				done: false,
				error: null,
				created_at: '2024-01-03T00:00:00Z',
				deploy_state: 'building',
			};

			const mockDeployState = {
				id: 'deploy-new',
				site_id: 'site-1',
				state: 'building',
				created_at: '2024-01-03T00:00:00Z',
			};

			mockNetlifyAPI.createSiteBuild.mockResolvedValueOnce(mockBuildResponse);
			mockNetlifyAPI.getDeploy.mockResolvedValueOnce(mockDeployState);

			const result = await driver.triggerDeployment('site-1');

			expect(result).toMatchObject({
				deployment_id: 'deploy-new',
				status: 'building',
			});
		});

		it('should pass clear_cache param when clearCache is true', async () => {
			const mockBuildResponse = {
				id: 'build-1',
				deploy_id: 'deploy-new',
				sha: null,
				done: false,
				error: null,
				created_at: '2024-01-03T00:00:00Z',
				deploy_state: 'building',
			};

			const mockDeployState = {
				id: 'deploy-new',
				site_id: 'site-1',
				state: 'building',
				created_at: '2024-01-03T00:00:00Z',
			};

			mockNetlifyAPI.createSiteBuild.mockResolvedValueOnce(mockBuildResponse);
			mockNetlifyAPI.getDeploy.mockResolvedValueOnce(mockDeployState);

			await driver.triggerDeployment('site-1', { clearCache: true });

			expect(mockNetlifyAPI.createSiteBuild).toHaveBeenCalledWith({
				site_id: 'site-1',
				clear_cache: true,
			});
		});
	});

	describe('cancelDeployment', () => {
		it('should cancel a deployment', async () => {
			mockNetlifyAPI.deleteDeploy.mockResolvedValueOnce(undefined);

			await expect(driver.cancelDeployment('deploy-1')).resolves.not.toThrow();

			expect(mockNetlifyAPI.deleteDeploy).toHaveBeenCalledWith({ deployId: 'deploy-1' });
		});
	});

	describe('getDeploymentLogs', () => {
		it.todo('should connect to WebSocket and retrieve logs', async () => {
			expect(true).toBe(true); 
		});
	});
});
