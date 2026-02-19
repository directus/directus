import { createHmac } from 'node:crypto';
import { HitRateLimitError, InvalidCredentialsError, ServiceUnavailableError } from '@directus/errors';
import type { AxiosResponse } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { VercelDriver } from './vercel.js';

const mockAxiosRequest = vi.hoisted(() => vi.fn());

vi.mock('../../request/index.js', () => ({
	getAxios: () => ({ request: mockAxiosRequest }),
}));

function createAxiosResponse(status: number, data: unknown, headers: Record<string, string> = {}): AxiosResponse {
	return {
		status,
		data,
		headers,
		statusText: '',
		config: {} as any,
	};
}

describe('VercelDriver', () => {
	let driver: VercelDriver;

	beforeEach(() => {
		vi.clearAllMocks();
		driver = new VercelDriver({ access_token: 'test-token' });
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('authentication', () => {
		it('should send Bearer token in Authorization header', async () => {
			mockAxiosRequest.mockResolvedValueOnce(createAxiosResponse(200, undefined));

			await driver.testConnection();

			expect(mockAxiosRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					headers: expect.objectContaining({
						Authorization: 'Bearer test-token',
					}),
				}),
			);
		});

		it('should include teamId param when team_id option is set', async () => {
			const driverWithTeam = new VercelDriver({ access_token: 'test-token' }, { team_id: 'team-123' });
			mockAxiosRequest.mockResolvedValueOnce(createAxiosResponse(200, undefined));

			await driverWithTeam.testConnection();

			const calledUrl = mockAxiosRequest.mock.calls[0]![0].url as string;
			expect(calledUrl).toContain('teamId=team-123');
		});
	});

	describe('error handling', () => {
		it('should throw InvalidCredentialsError on 401', async () => {
			mockAxiosRequest.mockResolvedValueOnce(createAxiosResponse(401, { error: { message: 'Unauthorized' } }));

			await expect(driver.listProjects()).rejects.toThrow(InvalidCredentialsError);
		});

		it('should throw InvalidCredentialsError on 403', async () => {
			mockAxiosRequest.mockResolvedValueOnce(createAxiosResponse(403, { error: { message: 'Forbidden' } }));

			await expect(driver.listProjects()).rejects.toThrow(InvalidCredentialsError);
		});

		it('should throw ServiceUnavailableError on other 4xx/5xx errors', async () => {
			mockAxiosRequest.mockResolvedValueOnce(createAxiosResponse(500, { error: { message: 'Internal Server Error' } }));

			await expect(driver.listProjects()).rejects.toThrow(ServiceUnavailableError);
		});
	});

	describe('rate limiting', () => {
		// Reset timestamp in past = Math.max(past - now, 1000) = 1000ms minimum wait
		const rateLimitHeaders = { 'x-ratelimit-reset': '1' };

		it('should retry on 429 and succeed on second attempt', async () => {
			mockAxiosRequest
				.mockResolvedValueOnce(createAxiosResponse(429, {}, rateLimitHeaders))
				.mockResolvedValueOnce(createAxiosResponse(200, { projects: [] }));

			const result = await driver.listProjects();

			expect(mockAxiosRequest).toHaveBeenCalledTimes(2);
			expect(result).toEqual([]);
		}, 10000);

		it('should throw HitRateLimitError after 3 retries', async () => {
			mockAxiosRequest.mockResolvedValue(createAxiosResponse(429, {}, rateLimitHeaders));

			await expect(driver.listProjects()).rejects.toThrow(HitRateLimitError);
			expect(mockAxiosRequest).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
		}, 15000);
	});

	describe('testConnection', () => {
		it('should call /v9/projects with limit=1', async () => {
			mockAxiosRequest.mockResolvedValueOnce(createAxiosResponse(200, undefined));

			await driver.testConnection();

			const calledUrl = mockAxiosRequest.mock.calls[0]![0].url as string;
			expect(calledUrl).toContain('/v9/projects');
			expect(calledUrl).toContain('limit=1');
		});
	});

	describe('listProjects', () => {
		it('should return mapped projects', async () => {
			const mockResponse = {
				projects: [
					{ id: 'proj-1', name: 'My App', framework: 'nextjs', link: { type: 'github' } },
					{ id: 'proj-2', name: 'Static Site' },
				],
			};

			const expected = [
				{ id: 'proj-1', name: 'My App', framework: 'nextjs', deployable: true },
				{ id: 'proj-2', name: 'Static Site', deployable: false },
			];

			mockAxiosRequest.mockResolvedValueOnce(createAxiosResponse(200, mockResponse));

			const result = await driver.listProjects();

			expect(result).toEqual(expected);
		});

		it('should return empty array when no projects', async () => {
			mockAxiosRequest.mockResolvedValueOnce(createAxiosResponse(200, { projects: [] }));

			const result = await driver.listProjects();

			expect(result).toEqual([]);
		});
	});

	describe('getProject', () => {
		it('should return project with production details', async () => {
			const mockResponse = {
				id: 'proj-1',
				name: 'My App',
				framework: 'nextjs',
				link: { type: 'github' },
				targets: {
					production: {
						alias: ['my-app.vercel.app'],
						readyState: 'READY',
						createdAt: 1700000000000,
						readyAt: 1700000060000,
					},
				},
				createdAt: 1690000000000,
				updatedAt: 1700000000000,
			};

			const expected = {
				id: 'proj-1',
				name: 'My App',
				framework: 'nextjs',
				deployable: true,
				url: 'https://my-app.vercel.app',
				latest_deployment: {
					status: 'ready',
					created_at: new Date(1700000000000),
					finished_at: new Date(1700000060000),
				},
				created_at: new Date(1690000000000),
				updated_at: new Date(1700000000000),
			};

			mockAxiosRequest.mockResolvedValueOnce(createAxiosResponse(200, mockResponse));

			const result = await driver.getProject('proj-1');

			expect(result).toEqual(expected);
		});

		it('should handle project with minimal fields from Vercel', async () => {
			const mockResponse = { id: 'proj-2', name: 'Basic' };
			const expected = { id: 'proj-2', name: 'Basic', deployable: false };

			mockAxiosRequest.mockResolvedValueOnce(createAxiosResponse(200, mockResponse));

			const result = await driver.getProject('proj-2');

			expect(result).toEqual(expected);
		});
	});

	describe('listDeployments', () => {
		it('should return mapped deployments', async () => {
			const mockResponse = {
				deployments: [
					{
						uid: 'dpl-1',
						id: 'dpl-1',
						projectId: 'proj-1',
						state: 'READY',
						url: 'my-app-abc123.vercel.app',
						createdAt: 1700000000000,
						ready: 1700000060000,
					},
					{
						uid: 'dpl-2',
						id: 'dpl-2',
						projectId: 'proj-1',
						state: 'BUILDING',
						createdAt: 1700001000000,
					},
				],
			};

			const expected = [
				{
					id: 'dpl-1',
					project_id: 'proj-1',
					status: 'ready',
					url: 'https://my-app-abc123.vercel.app',
					created_at: new Date(1700000000000),
					finished_at: new Date(1700000060000),
				},
				{
					id: 'dpl-2',
					project_id: 'proj-1',
					status: 'building',
					created_at: new Date(1700001000000),
				},
			];

			mockAxiosRequest.mockResolvedValueOnce(createAxiosResponse(200, mockResponse));

			const result = await driver.listDeployments('proj-1');

			expect(result).toEqual(expected);
		});
	});

	describe('getDeployment', () => {
		it('should return deployment details', async () => {
			const mockResponse = {
				id: 'dpl-1',
				projectId: 'proj-1',
				status: 'READY',
				url: 'my-app-abc123.vercel.app',
				createdAt: 1700000000000,
				ready: 1700000060000,
			};

			const expected = {
				id: 'dpl-1',
				project_id: 'proj-1',
				status: 'ready',
				url: 'https://my-app-abc123.vercel.app',
				created_at: new Date(1700000000000),
				finished_at: new Date(1700000060000),
			};

			mockAxiosRequest.mockResolvedValueOnce(createAxiosResponse(200, mockResponse));

			const result = await driver.getDeployment('dpl-1');

			expect(result).toEqual(expected);
		});

		it('should fallback to state when status is missing', async () => {
			const mockResponse = { id: 'dpl-1', state: 'BUILDING', createdAt: 1700000000000 };
			mockAxiosRequest.mockResolvedValueOnce(createAxiosResponse(200, mockResponse));

			const result = await driver.getDeployment('dpl-1');

			expect(result.status).toBe('building');
		});
	});

	describe('triggerDeployment', () => {
		it('should fetch project then trigger deployment', async () => {
			const projectResponse = {
				id: 'proj-1',
				name: 'My App',
				link: { type: 'github', productionBranch: 'main', repoId: 'repo-123' },
			};

			const deployResponse = {
				id: 'dpl-new',
				status: 'BUILDING',
				url: 'my-app-new.vercel.app',
				createdAt: 1700000000000,
			};

			const expected = {
				deployment_id: 'dpl-new',
				status: 'building',
				url: 'https://my-app-new.vercel.app',
				created_at: new Date(1700000000000),
			};

			mockAxiosRequest
				.mockResolvedValueOnce(createAxiosResponse(200, projectResponse))
				.mockResolvedValueOnce(createAxiosResponse(200, deployResponse));

			const result = await driver.triggerDeployment('proj-1');

			expect(result).toEqual(expected);

			// Verify POST body
			const triggerCall = mockAxiosRequest.mock.calls[1]![0];
			const body = JSON.parse(triggerCall.data);

			expect(triggerCall.method).toBe('POST');
			expect(body.name).toBe('My App');
			expect(body.project).toBe('proj-1');
			expect(body.target).toBe('production');
			expect(body.gitSource).toEqual({ type: 'github', ref: 'main', repoId: 'repo-123' });
		});

		it('should not set target when preview=true', async () => {
			mockAxiosRequest
				.mockResolvedValueOnce(createAxiosResponse(200, { id: 'proj-1', name: 'My App' }))
				.mockResolvedValueOnce(createAxiosResponse(200, { id: 'dpl-new', status: 'BUILDING' }));

			await driver.triggerDeployment('proj-1', { preview: true });

			const body = JSON.parse(mockAxiosRequest.mock.calls[1]![0].data);
			expect(body.target).toBeUndefined();
		});

		it('should add forceNew param when clearCache=true', async () => {
			mockAxiosRequest
				.mockResolvedValueOnce(createAxiosResponse(200, { id: 'proj-1', name: 'My App' }))
				.mockResolvedValueOnce(createAxiosResponse(200, { id: 'dpl-new', status: 'BUILDING' }));

			await driver.triggerDeployment('proj-1', { clearCache: true });

			const calledUrl = mockAxiosRequest.mock.calls[1]![0].url as string;
			expect(calledUrl).toContain('forceNew=1');
		});
	});

	describe('cancelDeployment', () => {
		it('should send PATCH to cancel endpoint', async () => {
			mockAxiosRequest.mockResolvedValueOnce(createAxiosResponse(200, {}));

			await driver.cancelDeployment('dpl-1');

			const call = mockAxiosRequest.mock.calls[0]![0];
			expect(call.method).toBe('PATCH');
			expect(call.url).toContain('/v12/deployments/dpl-1/cancel');
		});
	});

	describe('getDeploymentLogs', () => {
		it('should return filtered and mapped logs', async () => {
			const mockResponse = [
				{ type: 'stdout', created: 1700000000000, text: 'Building...' },
				{ type: 'stderr', created: 1700000001000, text: 'Warning: dep deprecated' },
				{ type: 'command', created: 1700000002000, payload: { text: 'npm run build' } },
				{ type: 'delimiter', created: 1700000003000 }, // should be filtered out
			];

			const expected = [
				{ timestamp: new Date(1700000000000), type: 'stdout', message: 'Building...' },
				{ timestamp: new Date(1700000001000), type: 'stderr', message: 'Warning: dep deprecated' },
				{ timestamp: new Date(1700000002000), type: 'info', message: 'npm run build' },
			];

			mockAxiosRequest.mockResolvedValueOnce(createAxiosResponse(200, mockResponse));

			const result = await driver.getDeploymentLogs('dpl-1');

			expect(result).toEqual(expected);
		});

		it('should pass since parameter as milliseconds', async () => {
			mockAxiosRequest.mockResolvedValueOnce(createAxiosResponse(200, []));
			const since = new Date(1700000000000);

			await driver.getDeploymentLogs('dpl-1', { since });

			const calledUrl = mockAxiosRequest.mock.calls[0]![0].url as string;
			expect(calledUrl).toContain('since=1700000000000');
		});
	});

	describe('mapStatus', () => {
		it.each([
			['BUILDING', 'building'],
			['ERROR', 'error'],
			['CANCELED', 'canceled'],
			['READY', 'ready'],
			['QUEUED', 'building'],
			['INITIALIZING', 'building'],
			['ANALYZING', 'building'],
			['DEPLOYING', 'building'],
			[undefined, 'building'],
		])('should map Vercel status "%s" to "%s"', async (vercelStatus, expected) => {
			mockAxiosRequest.mockResolvedValueOnce(
				createAxiosResponse(200, { id: 'dpl-1', status: vercelStatus, createdAt: 1700000000000 }),
			);

			const result = await driver.getDeployment('dpl-1');

			expect(result.status).toBe(expected);
		});
	});

	describe('registerWebhook', () => {
		it('should call POST /v1/webhooks with url and events', async () => {
			const webhookResponse = { id: 'hook_123', secret: 'whsec_abc' };
			mockAxiosRequest.mockResolvedValueOnce(createAxiosResponse(200, webhookResponse));

			const result = await driver.registerWebhook('https://example.com/webhooks/vercel', ['prj_123', 'prj_456']);

			expect(result).toEqual({ webhook_ids: ['hook_123'], webhook_secret: 'whsec_abc' });

			const call = mockAxiosRequest.mock.calls[0]![0];
			expect(call.method).toBe('POST');
			expect(call.url).toContain('/v1/webhooks');

			const body = JSON.parse(call.data);
			expect(body.url).toBe('https://example.com/webhooks/vercel');
			expect(body.events).toContain('deployment.created');
			expect(body.events).toContain('deployment.succeeded');
			expect(body.events).toContain('deployment.error');
			expect(body.events).toContain('deployment.canceled');
		});
	});

	describe('unregisterWebhook', () => {
		it('should call DELETE /v1/webhooks/:id for each webhook', async () => {
			mockAxiosRequest.mockResolvedValueOnce(createAxiosResponse(200, {}));

			await driver.unregisterWebhook(['hook_123']);

			const call = mockAxiosRequest.mock.calls[0]![0];
			expect(call.method).toBe('DELETE');
			expect(call.url).toContain('/v1/webhooks/hook_123');
		});
	});

	describe('verifyAndParseWebhook', () => {
		const secret = 'test-webhook-secret';

		function createWebhookPayload(type: string) {
			return {
				type,
				id: 'evt_123',
				createdAt: 1700000000000,
				payload: {
					deployment: { id: 'dpl_abc', url: 'my-app-abc.vercel.app', name: 'my-app' },
					project: { id: 'prj_xyz' },
					target: 'production',
				},
			};
		}

		function signPayload(body: Buffer): string {
			return createHmac('sha1', secret).update(body).digest('hex');
		}

		it('should verify valid signature and parse deployment.succeeded event', () => {
			const payload = createWebhookPayload('deployment.succeeded');
			const rawBody = Buffer.from(JSON.stringify(payload));
			const signature = signPayload(rawBody);

			const result = driver.verifyAndParseWebhook(rawBody, { 'x-vercel-signature': signature }, secret);

			expect(result).not.toBeNull();
			expect(result!.type).toBe('deployment.succeeded');
			expect(result!.provider).toBe('vercel');
			expect(result!.project_external_id).toBe('prj_xyz');
			expect(result!.deployment_external_id).toBe('dpl_abc');
			expect(result!.status).toBe('ready');
			expect(result!.url).toBe('https://my-app-abc.vercel.app');
			expect(result!.target).toBe('production');
			expect(result!.timestamp).toEqual(new Date(1700000000000));
		});

		it('should return null for invalid signature', () => {
			const payload = createWebhookPayload('deployment.succeeded');
			const rawBody = Buffer.from(JSON.stringify(payload));

			const result = driver.verifyAndParseWebhook(rawBody, { 'x-vercel-signature': 'invalid-sig' }, secret);

			expect(result).toBeNull();
		});

		it('should return null for missing signature header', () => {
			const payload = createWebhookPayload('deployment.succeeded');
			const rawBody = Buffer.from(JSON.stringify(payload));

			const result = driver.verifyAndParseWebhook(rawBody, {}, secret);

			expect(result).toBeNull();
		});

		it('should return null for unsupported event type', () => {
			const payload = createWebhookPayload('project.created');
			const rawBody = Buffer.from(JSON.stringify(payload));
			const signature = signPayload(rawBody);

			const result = driver.verifyAndParseWebhook(rawBody, { 'x-vercel-signature': signature }, secret);

			expect(result).toBeNull();
		});

		it.each([
			['deployment.created', 'building'],
			['deployment.succeeded', 'ready'],
			['deployment.error', 'error'],
			['deployment.canceled', 'canceled'],
		])('should map event type "%s" to status "%s"', (eventType, expectedStatus) => {
			const payload = createWebhookPayload(eventType);
			const rawBody = Buffer.from(JSON.stringify(payload));
			const signature = signPayload(rawBody);

			const result = driver.verifyAndParseWebhook(rawBody, { 'x-vercel-signature': signature }, secret);

			expect(result!.status).toBe(expectedStatus);
		});
	});
});
