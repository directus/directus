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
	createHookBySiteId: vi.fn(),
	listHooksBySiteId: vi.fn(),
	deleteHook: vi.fn(),
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

		it('should paginate when response length equals perPage', async () => {
			const fullPage = Array.from({ length: 100 }, (_, i) => ({
				id: `site-${i}`,
				name: `Site ${i}`,
				build_settings: { provider: 'github', repo_url: 'https://github.com/user/repo' },
			}));

			const secondPage = [
				{
					id: 'site-100',
					name: 'Site 100',
					build_settings: { provider: 'github', repo_url: 'https://github.com/user/repo' },
				},
			];

			mockNetlifyAPI.listSites.mockResolvedValueOnce(fullPage).mockResolvedValueOnce(secondPage);

			const projects = await driver.listProjects();

			expect(projects).toHaveLength(101);
			expect(mockNetlifyAPI.listSites).toHaveBeenCalledTimes(2);

			expect(mockNetlifyAPI.listSites).toHaveBeenNthCalledWith(1, { per_page: '100', page: '1' });
			expect(mockNetlifyAPI.listSites).toHaveBeenNthCalledWith(2, { per_page: '100', page: '2' });
		});

		it('should stop paginating when total is an exact multiple of perPage', async () => {
			const exactPage = Array.from({ length: 100 }, (_, i) => ({
				id: `site-${i}`,
				name: `Site ${i}`,
				build_settings: { provider: 'github', repo_url: 'https://github.com/user/repo' },
			}));

			mockNetlifyAPI.listSites.mockResolvedValueOnce(exactPage).mockResolvedValueOnce([]);

			const projects = await driver.listProjects();

			expect(projects).toHaveLength(100);
			expect(mockNetlifyAPI.listSites).toHaveBeenCalledTimes(2);
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
		it('should cancel a deployment and return canceled', async () => {
			mockNetlifyAPI.cancelSiteDeploy.mockResolvedValueOnce(undefined);

			const status = await driver.cancelDeployment('deploy-1');

			expect(mockNetlifyAPI.cancelSiteDeploy).toHaveBeenCalledWith({ deployId: 'deploy-1' });
			expect(status).toBe('canceled');
		});

		it('should return actual status when deployment already finished', async () => {
			mockNetlifyAPI.cancelSiteDeploy.mockRejectedValueOnce(Object.assign(new Error('Cannot cancel'), { status: 400 }));

			mockNetlifyAPI.getDeploy.mockResolvedValueOnce({
				id: 'deploy-1',
				site_id: 'site-1',
				state: 'ready',
				created_at: new Date().toISOString(),
			});

			const status = await driver.cancelDeployment('deploy-1');

			expect(status).toBe('ready');
		});

		it('should throw when deployment is still building and cancel fails', async () => {
			mockNetlifyAPI.cancelSiteDeploy.mockRejectedValueOnce(Object.assign(new Error('Cannot cancel'), { status: 400 }));

			mockNetlifyAPI.getDeploy.mockResolvedValueOnce({
				id: 'deploy-1',
				site_id: 'site-1',
				state: 'building',
				created_at: new Date().toISOString(),
			});

			await expect(driver.cancelDeployment('deploy-1')).rejects.toThrow(ServiceUnavailableError);
		});
	});

	describe('getDeploymentLogs', () => {
		let mockWebSocket: {
			send: ReturnType<typeof vi.fn>;
			close: ReturnType<typeof vi.fn>;
			addEventListener: ReturnType<typeof vi.fn>;
		};

		const flushMicrotasks = () => new Promise<void>((resolve) => process.nextTick(resolve));

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

		it('should return all logs for a completed build', async () => {
			mockNetlifyAPI.getDeploy.mockResolvedValueOnce({ state: 'ready' });
			const logsPromise = driver.getDeploymentLogs('deploy-1');

			await flushMicrotasks();

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

		it('should return current logs for an in-progress build', async () => {
			mockNetlifyAPI.getDeploy.mockResolvedValueOnce({ state: 'building' });
			const logsPromise = driver.getDeploymentLogs('deploy-building');

			await flushMicrotasks();

			const openHandler = mockWebSocket.addEventListener.mock.calls.find((call) => call[0] === 'open')?.[1];
			openHandler();

			const messageHandler = mockWebSocket.addEventListener.mock.calls.find((call) => call[0] === 'message')?.[1];

			messageHandler({ data: JSON.stringify({ ts: '2024-01-01T00:00:00Z', type: 'stdout', message: 'Building...' }) });

			// No report message — build still in progress
			const logs = await logsPromise;

			expect(logs).toHaveLength(1);
			expect(logs[0]!.message).toBe('Building...');
		});

		it('should throw ServiceUnavailableError on WebSocket error', async () => {
			mockNetlifyAPI.getDeploy.mockResolvedValueOnce({ state: 'building' });
			const logsPromise = driver.getDeploymentLogs('deploy-err');

			await flushMicrotasks();

			const errorHandler = mockWebSocket.addEventListener.mock.calls.find((call) => call[0] === 'error')?.[1];
			expect(errorHandler).toBeDefined();
			errorHandler();

			await expect(logsPromise).rejects.toThrow(ServiceUnavailableError);
		});

		it('should throw ServiceUnavailableError on connection timeout', async () => {
			vi.useFakeTimers();

			mockNetlifyAPI.getDeploy.mockResolvedValueOnce({ state: 'building' });
			const logsPromise = driver.getDeploymentLogs('deploy-timeout');

			// Attach rejection handler before advancing timers to prevent unhandled rejection
			const expectation = expect(logsPromise).rejects.toThrow(ServiceUnavailableError);

			await vi.advanceTimersByTimeAsync(10_000);
			await expectation;

			vi.useRealTimers();
		});

		it('should filter logs with since parameter for a completed build', async () => {
			const sinceDate = new Date('2024-01-01T00:00:05Z');

			mockNetlifyAPI.getDeploy.mockResolvedValueOnce({ state: 'ready' });
			const logsPromise = driver.getDeploymentLogs('deploy-2', { since: sinceDate });

			await flushMicrotasks();

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

	describe('registerWebhook', () => {
		it('should create hooks for each site and event', async () => {
			let callCount = 0;

			mockNetlifyAPI.listHooksBySiteId.mockResolvedValue([]);

			mockNetlifyAPI.createHookBySiteId.mockImplementation(() => {
				callCount++;
				return Promise.resolve({ id: `hook_${callCount}` });
			});

			const result = await driver.registerWebhook('https://example.com/webhooks/netlify', ['site_1', 'site_2']);

			// 3 events × 2 sites = 6 hooks
			expect(mockNetlifyAPI.createHookBySiteId).toHaveBeenCalledTimes(6);
			expect(result.webhook_ids).toHaveLength(6);
			expect(result.webhook_ids).toEqual(['hook_1', 'hook_2', 'hook_3', 'hook_4', 'hook_5', 'hook_6']);
			expect(result.webhook_secret).toBeTruthy();
			expect(result.webhook_secret.length).toBe(64); // 32 bytes hex

			// Verify URL includes token
			const firstCall = mockNetlifyAPI.createHookBySiteId.mock.calls[0]![0];
			expect(firstCall.site_id).toBe('site_1');
			expect(firstCall.body.type).toBe('url');
			expect(firstCall.body.data.url).toContain('https://example.com/webhooks/netlify?token=');
		});

		it('should cleanup stale hooks before registering', async () => {
			mockNetlifyAPI.listHooksBySiteId.mockResolvedValue([
				{ id: 'old_hook_1', data: { url: 'https://example.com/webhooks/netlify?token=old' } },
			]);

			mockNetlifyAPI.deleteHook.mockResolvedValue(undefined);

			mockNetlifyAPI.createHookBySiteId.mockResolvedValue({ id: 'new_hook' });

			await driver.registerWebhook('https://example.com/webhooks/netlify', ['site_1']);

			// Stale hook should be deleted before new ones are created
			expect(mockNetlifyAPI.deleteHook).toHaveBeenCalledWith({ hook_id: 'old_hook_1' });
			expect(mockNetlifyAPI.createHookBySiteId).toHaveBeenCalledTimes(3);
		});
	});

	describe('unregisterWebhook', () => {
		it('should delete each hook by ID', async () => {
			mockNetlifyAPI.deleteHook.mockResolvedValue(undefined);

			await driver.unregisterWebhook(['hook_1', 'hook_2', 'hook_3']);

			expect(mockNetlifyAPI.deleteHook).toHaveBeenCalledTimes(3);
			expect(mockNetlifyAPI.deleteHook).toHaveBeenCalledWith({ hook_id: 'hook_1' });
			expect(mockNetlifyAPI.deleteHook).toHaveBeenCalledWith({ hook_id: 'hook_2' });
			expect(mockNetlifyAPI.deleteHook).toHaveBeenCalledWith({ hook_id: 'hook_3' });
		});

		it('should not throw if some deletes fail', async () => {
			mockNetlifyAPI.deleteHook
				.mockResolvedValueOnce(undefined)
				.mockRejectedValueOnce(new Error('Not found'))
				.mockResolvedValueOnce(undefined);

			await expect(driver.unregisterWebhook(['hook_1', 'hook_2', 'hook_3'])).resolves.not.toThrow();
		});
	});

	describe('verifyAndParseWebhook', () => {
		const secret = 'test-webhook-secret';

		function createDeployPayload(state: string) {
			return {
				id: 'deploy_abc',
				site_id: 'site_xyz',
				state,
				ssl_url: 'https://my-site.netlify.app',
				context: 'production',
				created_at: '2024-06-01T12:00:00Z',
				branch: 'main',
			};
		}

		it('should verify valid token and parse ready deploy', () => {
			const deploy = createDeployPayload('ready');
			const rawBody = Buffer.from(JSON.stringify(deploy));

			const result = driver.verifyAndParseWebhook(rawBody, { 'x-webhook-token': secret }, secret);

			expect(result).not.toBeNull();
			expect(result!.type).toBe('deployment.succeeded');
			expect(result!.provider).toBe('netlify');
			expect(result!.project_external_id).toBe('site_xyz');
			expect(result!.deployment_external_id).toBe('deploy_abc');
			expect(result!.status).toBe('ready');
			expect(result!.url).toBe('https://my-site.netlify.app');
			expect(result!.target).toBe('production');
			expect(result!.timestamp).toEqual(new Date('2024-06-01T12:00:00Z'));
		});

		it('should return null for missing token header', () => {
			const deploy = createDeployPayload('ready');
			const rawBody = Buffer.from(JSON.stringify(deploy));

			const result = driver.verifyAndParseWebhook(rawBody, {}, secret);

			expect(result).toBeNull();
		});

		it('should return null for wrong token', () => {
			const deploy = createDeployPayload('ready');
			const rawBody = Buffer.from(JSON.stringify(deploy));

			const result = driver.verifyAndParseWebhook(rawBody, { 'x-webhook-token': 'wrong-token' }, secret);

			expect(result).toBeNull();
		});

		it('should return null for unmapped state', () => {
			const deploy = createDeployPayload('canceled');
			const rawBody = Buffer.from(JSON.stringify(deploy));

			const result = driver.verifyAndParseWebhook(rawBody, { 'x-webhook-token': secret }, secret);

			// 'canceled' maps to 'canceled' via mapStatus, and 'canceled' is NOT in STATE_TO_EVENT
			expect(result).toBeNull();
		});

		it.each([
			['building', 'deployment.created', 'building'],
			['ready', 'deployment.succeeded', 'ready'],
			['error', 'deployment.error', 'error'],
		])('should map state "%s" to type "%s" with status "%s"', (state, expectedType, expectedStatus) => {
			const deploy = createDeployPayload(state);
			const rawBody = Buffer.from(JSON.stringify(deploy));

			const result = driver.verifyAndParseWebhook(rawBody, { 'x-webhook-token': secret }, secret);

			expect(result!.type).toBe(expectedType);
			expect(result!.status).toBe(expectedStatus);
		});
	});
});
