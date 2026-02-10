import { InvalidCredentialsError, ServiceUnavailableError } from '@directus/errors';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NetlifyDriver } from './netlify.js';

const mockNetlifyAPI = vi.hoisted(() => ({
	listSites: vi.fn(),
	listSitesForAccount: vi.fn(),
	getSite: vi.fn(),
	listSiteDeploys: vi.fn(),
	getDeploy: vi.fn(),
	createSiteBuild: vi.fn(),
	cancelSiteDeploy: vi.fn(),
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
			mockNetlifyAPI.listSitesForAccount.mockResolvedValueOnce([]);

			await driverWithAccount.listProjects();

			expect(mockNetlifyAPI.listSitesForAccount).toHaveBeenCalledWith(
				expect.objectContaining({
					account_slug: 'account-123',
					per_page: '100',
				}),
			);
		});

		it('should include list all sites when no account_slug option is set', async () => {
			const driverWithoutAccount = new NetlifyDriver({ access_token: 'test-token' });
			mockNetlifyAPI.listSites.mockResolvedValueOnce([]);

			await driverWithoutAccount.listProjects();

			expect(mockNetlifyAPI.listSites).toHaveBeenCalledWith(
				expect.objectContaining({
					per_page: '100',
				}),
			);
		});
	});

	describe('error handling', () => {
		it('should throw InvalidCredentialsError on 401', async () => {
			const error = Object.assign(new Error('Unauthorized'), { status: 401 });
			mockNetlifyAPI.listSites.mockRejectedValueOnce(error);

			await expect(driver.testConnection()).rejects.toThrow(InvalidCredentialsError);
		});

		it('should throw InvalidCredentialsError on 403', async () => {
			const error = Object.assign(new Error('Forbidden'), { status: 403 });
			mockNetlifyAPI.listSites.mockRejectedValueOnce(error);

			await expect(driver.testConnection()).rejects.toThrow(InvalidCredentialsError);
		});

		it('should throw ServiceUnavailableError on other API errors', async () => {
			const error = Object.assign(new Error('Internal Server Error'), { status: 500 });
			mockNetlifyAPI.listSites.mockRejectedValueOnce(error);

			await expect(driver.testConnection()).rejects.toThrow(ServiceUnavailableError);
		});

		it('should rethrow non-HTTP errors as-is', async () => {
			const error = new Error('Network failure');
			mockNetlifyAPI.listSites.mockRejectedValueOnce(error);

			await expect(driver.testConnection()).rejects.toThrow('Network failure');
		});
	});

	describe('status mapping', () => {
		it.each([
			['ready', 'ready'],
			['error', 'error'],
			['canceled', 'canceled'],
			['building', 'building'],
			['enqueued', 'building'],
			['processing', 'building'],
			['preparing', 'building'],
			['new', 'building'],
			['uploaded', 'building'],
			[undefined, 'building'],
		])('should map Netlify state "%s" to "%s"', async (netlifyState, expected) => {
			mockNetlifyAPI.getDeploy.mockResolvedValueOnce({
				id: 'deploy-1',
				site_id: 'site-1',
				state: netlifyState,
				created_at: '2024-01-01T00:00:00Z',
			});

			const deployment = await driver.getDeployment('deploy-1');

			expect(deployment.status).toBe(expected);
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
			mockNetlifyAPI.cancelSiteDeploy.mockResolvedValueOnce(undefined);

			await expect(driver.cancelDeployment('deploy-1')).resolves.not.toThrow();

			expect(mockNetlifyAPI.cancelSiteDeploy).toHaveBeenCalledWith({ deployId: 'deploy-1' });
		});
	});

	describe('getDeploymentLogs', () => {
		let mockWebSocket: {
			send: ReturnType<typeof vi.fn>;
			close: ReturnType<typeof vi.fn>;
			addEventListener: ReturnType<typeof vi.fn>;
		};

		beforeEach(() => {
			mockWebSocket = {
				send: vi.fn(),
				close: vi.fn(),
				addEventListener: vi.fn(),
			};

			vi.stubGlobal(
				'WebSocket',
				vi.fn(() => mockWebSocket),
			);
		});

		afterEach(() => {
			vi.unstubAllGlobals();
		});

		it('should return filtered and mapped logs', async () => {
			const logsPromise = driver.getDeploymentLogs('deploy-1');

			const openHandler = mockWebSocket.addEventListener.mock.calls.find((call) => call[0] === 'open')?.[1];
			expect(openHandler).toBeDefined();
			openHandler();

			expect(mockWebSocket.send).toHaveBeenCalledWith(
				expect.stringContaining('{"deploy_id":"deploy-1","access_token":"test-token"}'),
			);

			const messageHandler = mockWebSocket.addEventListener.mock.calls.find((call) => call[0] === 'message')?.[1];
			expect(messageHandler).toBeDefined();

			const messages = [
				{
					ts: '2024-01-01T00:00:00Z',
					type: 'stdout',
					message: '\x1b[32mBuilding project...\x1b[0m\r\n',
				},
				{
					ts: '2024-01-01T00:00:05Z',
					type: 'stdout',
					message: 'Compiling files...',
				},
				{
					ts: '2024-01-01T00:00:10Z',
					type: 'report',
					message: 'Deploy complete',
				},
			];

			for (const message of messages) {
				messageHandler({
					data: JSON.stringify(message),
				});
			}

			const logs = await logsPromise;

			expect(logs).toHaveLength(3);

			expect(logs[0]).toMatchObject({
				timestamp: new Date('2024-01-01T00:00:00Z'),
				type: 'stdout',
				message: 'Building project...\n',
			});

			expect(logs[1]).toMatchObject({
				timestamp: new Date('2024-01-01T00:00:05Z'),
				type: 'stdout',
				message: 'Compiling files...',
			});

			expect(logs[2]).toMatchObject({
				timestamp: new Date('2024-01-01T00:00:10Z'),
				type: 'info',
				message: 'Deploy complete',
			});

			expect(mockWebSocket.close).toHaveBeenCalled();
		});

		it('should throw ServiceUnavailableError on WebSocket error', async () => {
			const logsPromise = driver.getDeploymentLogs('deploy-err');

			const errorHandler = mockWebSocket.addEventListener.mock.calls.find((call) => call[0] === 'error')?.[1];
			expect(errorHandler).toBeDefined();
			errorHandler();

			await expect(logsPromise).rejects.toThrow(ServiceUnavailableError);
		});

		it('should throw ServiceUnavailableError on connection timeout', async () => {
			vi.useFakeTimers();

			const logsPromise = driver.getDeploymentLogs('deploy-timeout');

			vi.advanceTimersByTime(10_000);

			await expect(logsPromise).rejects.toThrow(ServiceUnavailableError);

			vi.useRealTimers();
		});

		it('should pass since parameter as milliseconds', async () => {
			const sinceDate = new Date('2024-01-01T00:00:05Z');
			const logsPromise = driver.getDeploymentLogs('deploy-2', { since: sinceDate });

			const openHandler = mockWebSocket.addEventListener.mock.calls.find((call) => call[0] === 'open')?.[1];
			openHandler();

			const messageHandler = mockWebSocket.addEventListener.mock.calls.find((call) => call[0] === 'message')?.[1];

			const messages = [
				{
					ts: '2024-01-01T00:00:00Z',
					type: 'stdout',
					message: 'Old log before since date',
				},
				{
					ts: '2024-01-01T00:00:05Z',
					type: 'stdout',
					message: 'Log at exact since date',
				},
				{
					ts: '2024-01-01T00:00:10Z',
					type: 'stdout',
					message: 'New log after since date',
				},
				{
					ts: '2024-01-01T00:00:15Z',
					type: 'report',
					message: 'Done',
				},
			];

			for (const message of messages) {
				messageHandler({
					data: JSON.stringify(message),
				});
			}

			const logs = await logsPromise;

			expect(logs).toHaveLength(3);
			expect(logs[0]!.message).toBe('Log at exact since date');
			expect(logs[1]!.message).toBe('New log after since date');
			expect(logs[2]!.message).toBe('Done');

			expect(logs.some((log) => log.message === 'Old log before since date')).toBe(false);
		});
	});
});
