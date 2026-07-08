import {
	HitRateLimitError,
	InvalidCredentialsError,
	InvalidPayloadError,
	InvalidProviderConfigError,
	ServiceUnavailableError,
} from '@directus/errors';
import type { AxiosResponse } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CloudflareDriver } from './cloudflare.js';

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

describe('CloudflareDriver', () => {
	let driver: CloudflareDriver;
	const accountId = '023e105f4ecef8ad9ca31a8372d0c353';

	beforeEach(() => {
		vi.clearAllMocks();
		driver = new CloudflareDriver({ api_token: 'test-token' }, { account_id: accountId });
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('should declare poll transport, deploy hooks, and run status polling', () => {
		expect(driver.capabilities).toEqual({
			eventsTransport: 'poll',
			supportsPreviewDeploy: false,
			supportsDeployHookUrl: true,
			needsRunStatusPolling: true,
		});
	});

	describe('authentication', () => {
		it('should normalize account_id (hyphens, spaces, case) to 32 hex for API paths', async () => {
			const canonical = '023e105f4ecef8ad9ca31a8372d0c353';
			const uuidStyle = '023e105f-4ece-f8ad-9ca3-1a8372d0c353';

			const driverWithDashes = new CloudflareDriver({ api_token: 'test-token' }, { account_id: uuidStyle });

			mockAxiosRequest.mockResolvedValueOnce(createAxiosResponse(200, { success: true, result: [] }));
			await driverWithDashes.testConnection();

			const url = mockAxiosRequest.mock.calls[0]![0].url as string;
			expect(url).toContain(`accounts/${canonical}/`);

			mockAxiosRequest.mockClear();

			const driverSpaced = new CloudflareDriver(
				{ api_token: 'test-token' },
				{ account_id: '023e105f 4ecef8ad 9ca31a83 72d0c353' },
			);

			mockAxiosRequest.mockResolvedValueOnce(createAxiosResponse(200, { success: true, result: [] }));
			await driverSpaced.testConnection();

			expect((mockAxiosRequest.mock.calls[0]![0].url as string).includes(`accounts/${canonical}/`)).toBe(true);
		});

		it('should send Bearer token in Authorization header', async () => {
			mockAxiosRequest.mockResolvedValueOnce(createAxiosResponse(200, { success: true, result: [] }));

			await driver.testConnection();

			expect(mockAxiosRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					headers: expect.objectContaining({
						Authorization: 'Bearer test-token',
					}),
				}),
			);

			const calledUrl = mockAxiosRequest.mock.calls[0]![0].url as string;
			expect(calledUrl).toContain('/client/v4/accounts/');
		});
	});

	describe('testConnection', () => {
		it('should resolve when the accounts/workers/scripts request succeeds', async () => {
			mockAxiosRequest.mockResolvedValueOnce(createAxiosResponse(200, { success: true, result: [] }));
			await expect(driver.testConnection()).resolves.toBeUndefined();
		});

		it('should throw InvalidCredentialsError on 401', async () => {
			mockAxiosRequest.mockResolvedValueOnce(createAxiosResponse(401, { success: false }));
			await expect(driver.testConnection()).rejects.toThrow(InvalidCredentialsError);
		});
	});

	describe('error handling', () => {
		it('should throw InvalidCredentialsError on 401', async () => {
			mockAxiosRequest.mockResolvedValueOnce(createAxiosResponse(401, { success: false }));
			await expect(driver.listProjects()).rejects.toThrow(InvalidCredentialsError);
		});

		it('should throw InvalidCredentialsError on 403', async () => {
			mockAxiosRequest.mockResolvedValueOnce(createAxiosResponse(403, { success: false }));
			await expect(driver.listProjects()).rejects.toThrow(InvalidCredentialsError);
		});

		it('should throw ServiceUnavailableError on API failure', async () => {
			mockAxiosRequest.mockResolvedValueOnce(
				createAxiosResponse(500, { success: false, errors: [{ message: 'Cloudflare unavailable' }] }),
			);

			await expect(driver.listProjects()).rejects.toThrow(ServiceUnavailableError);
		});
	});

	describe('rate limiting', () => {
		beforeEach(() => {
			vi.useFakeTimers();
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it('should retry on 429 and succeed on second attempt', async () => {
			mockAxiosRequest
				.mockResolvedValueOnce(createAxiosResponse(429, { success: false }, { 'retry-after': '30' }))
				.mockResolvedValueOnce(createAxiosResponse(200, { success: true, result: [] }));

			const resultPromise = driver.listProjects();
			await vi.advanceTimersByTimeAsync(30_000);
			const result = await resultPromise;

			expect(mockAxiosRequest).toHaveBeenCalledTimes(2);
			expect(result).toEqual([]);
		});

		it('should throw HitRateLimitError after 3 retries', async () => {
			mockAxiosRequest.mockResolvedValue(createAxiosResponse(429, { success: false }, { 'retry-after': '30' }));

			const resultPromise = driver.listProjects();
			const assertion = expect(resultPromise).rejects.toThrow(HitRateLimitError);
			await vi.advanceTimersByTimeAsync(30_000 * 3);
			await assertion;

			expect(mockAxiosRequest).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
		});

		it('should default to a 60s wait when retry-after header is missing', async () => {
			mockAxiosRequest
				.mockResolvedValueOnce(createAxiosResponse(429, { success: false }, {}))
				.mockResolvedValueOnce(createAxiosResponse(200, { success: true, result: [] }));

			const resultPromise = driver.listProjects();
			await vi.advanceTimersByTimeAsync(60_000);
			const result = await resultPromise;

			expect(result).toEqual([]);
		});
	});

	describe('listProjects', () => {
		it('should map workers to projects using immutable tag as id', async () => {
			mockAxiosRequest
				.mockResolvedValueOnce(
					createAxiosResponse(200, {
						success: true,
						result: [
							{ id: 'my-worker', tag: 'worker-tag-1' },
							{ id: 'my-other-worker', tag: 'worker-tag-2' },
						],
					}),
				)
				.mockResolvedValueOnce(createAxiosResponse(200, { success: true, result: [{ deploy_hook_id: 'hook-1' }] }))
				.mockResolvedValueOnce(createAxiosResponse(200, { success: true, result: [{ deploy_hook_id: 'hook-2' }] }));

			const result = await driver.listProjects();

			expect(result).toEqual([
				{ id: 'worker-tag-1', name: 'my-worker', deployable: true },
				{ id: 'worker-tag-2', name: 'my-other-worker', deployable: true },
			]);
		});

		it('should mark project as non-deployable when worker has no triggers', async () => {
			mockAxiosRequest
				.mockResolvedValueOnce(
					createAxiosResponse(200, {
						success: true,
						result: [{ id: 'my-worker', tag: 'worker-tag-1' }],
					}),
				)
				.mockResolvedValueOnce(createAxiosResponse(200, { success: true, result: [] }));

			const result = await driver.listProjects();

			expect(result).toEqual([{ id: 'worker-tag-1', name: 'my-worker', deployable: false }]);
		});

		it('should mark project as deployable when build triggers exist', async () => {
			mockAxiosRequest
				.mockResolvedValueOnce(
					createAxiosResponse(200, {
						success: true,
						result: [{ id: 'my-worker', tag: 'worker-tag-1' }],
					}),
				)
				.mockResolvedValueOnce(createAxiosResponse(200, { success: true, result: [{ trigger_uuid: 'trigger-123' }] }));

			const result = await driver.listProjects();

			expect(result).toEqual([{ id: 'worker-tag-1', name: 'my-worker', deployable: true }]);
		});
	});

	describe('getProject', () => {
		it("should only check the requested worker's trigger, not every worker in the account", async () => {
			mockAxiosRequest
				.mockResolvedValueOnce(
					createAxiosResponse(200, {
						success: true,
						result: [
							{ id: 'worker-a', tag: 'worker-tag-a' },
							{ id: 'worker-b', tag: 'worker-tag-b' },
							{ id: 'worker-c', tag: 'worker-tag-c' },
						],
					}),
				)
				.mockResolvedValueOnce(createAxiosResponse(200, { success: true, result: [{ trigger_uuid: 'trigger-b' }] }));

			const result = await driver.getProject('worker-tag-b');

			expect(result).toEqual({ id: 'worker-tag-b', name: 'worker-b', deployable: true });
			// 1 call to list all workers + 1 trigger check for the one requested worker — not 1 + 3.
			expect(mockAxiosRequest).toHaveBeenCalledTimes(2);
			expect(mockAxiosRequest.mock.calls[1]![0].url).toContain('workers/worker-tag-b/triggers');
		});

		it('should throw when getProject is called for a worker that does not exist', async () => {
			mockAxiosRequest.mockResolvedValueOnce(
				createAxiosResponse(200, { success: true, result: [{ id: 'worker-a', tag: 'worker-tag-a' }] }),
			);

			await expect(driver.getProject('worker-tag-missing')).rejects.toThrow(ServiceUnavailableError);
		});
	});

	describe('status mapping', () => {
		it.each([
			['queued', undefined, 'building'],
			['active', undefined, 'building'],
			['running', undefined, 'building'],
			['initializing', undefined, 'building'],
			['stopped', 'success', 'ready'],
			['stopped', 'dce', 'ready'],
			['stopped', 'fail', 'error'],
			['stopped', 'canceled', 'canceled'],
			['stopped', undefined, 'building'],
			['stopped', 'unrecognized-outcome', 'building'],
			['success', undefined, 'ready'],
			['failed', undefined, 'error'],
			['cancelled', undefined, 'canceled'],
		])('should map Cloudflare status "%s" (outcome "%s") to "%s"', async (cloudflareStatus, buildOutcome, expected) => {
			mockAxiosRequest
				.mockResolvedValueOnce(
					createAxiosResponse(200, {
						success: true,
						result: {
							build_uuid: 'build-123',
							worker_tag: 'worker-tag-1',
							status: cloudflareStatus,
							build_outcome: buildOutcome,
							created_on: '2026-01-01T00:00:00.000Z',
						},
					}),
				)
				.mockResolvedValueOnce(
					createAxiosResponse(200, {
						success: true,
						result: { lines: [], events: [] },
					}),
				);

			const result = await driver.getRun('build-123');
			expect(result.status).toBe(expected);
		});
	});

	describe('cancelRun', () => {
		it('should map a cancel response with no build_outcome to "canceled", not "ready"', async () => {
			mockAxiosRequest.mockResolvedValueOnce(
				createAxiosResponse(200, { success: true, result: { status: 'stopped' } }),
			);

			const result = await driver.cancelRun('build-123');

			expect(result).toBe('canceled');
			expect(mockAxiosRequest.mock.calls[0]![0].url).toContain('/builds/builds/build-123/cancel');
			expect(mockAxiosRequest.mock.calls[0]![0].method).toBe('PUT');
		});

		it('should let a real build_outcome win over the canceled default (race with a build that just finished)', async () => {
			mockAxiosRequest.mockResolvedValueOnce(
				createAxiosResponse(200, { success: true, result: { status: 'stopped', build_outcome: 'success' } }),
			);

			const result = await driver.cancelRun('build-123');

			expect(result).toBe('ready');
		});

		it('should fall back to the run status when the cancel request fails but the build already finished', async () => {
			mockAxiosRequest
				.mockResolvedValueOnce(createAxiosResponse(500, { success: false, errors: [{ message: 'Conflict' }] }))
				.mockResolvedValueOnce(
					createAxiosResponse(200, {
						success: true,
						result: { status: 'stopped', build_outcome: 'success' },
					}),
				)
				.mockResolvedValueOnce(createAxiosResponse(200, { success: true, result: {} }));

			const result = await driver.cancelRun('build-123');

			expect(result).toBe('ready');
		});

		it('should throw ServiceUnavailableError when the cancel request fails and the build is still building', async () => {
			mockAxiosRequest
				.mockResolvedValueOnce(createAxiosResponse(500, { success: false, errors: [{ message: 'Conflict' }] }))
				.mockResolvedValueOnce(
					createAxiosResponse(200, {
						success: true,
						result: { status: 'active' },
					}),
				)
				.mockResolvedValueOnce(createAxiosResponse(200, { success: true, result: {} }));

			await expect(driver.cancelRun('build-123')).rejects.toThrow(ServiceUnavailableError);
		});
	});

	describe('triggerRun', () => {
		it('should trigger deployment using trigger UUID endpoint with branch', async () => {
			mockAxiosRequest
				.mockResolvedValueOnce(
					createAxiosResponse(200, {
						success: true,
						result: [{ trigger_uuid: 'trigger-123', branch_includes: ['main'] }],
					}),
				)
				.mockResolvedValueOnce(
					createAxiosResponse(200, {
						success: true,
						result: {
							build_uuid: 'build-123',
							status: 'active',
							created_at: '2026-01-01T00:00:00.000Z',
						},
					}),
				);

			const result = await driver.triggerRun('worker-tag-1');

			expect(result).toEqual({
				deployment_id: 'build-123',
				status: 'building',
				created_at: new Date('2026-01-01T00:00:00.000Z'),
			});

			const calledUrl = mockAxiosRequest.mock.calls[1]![0].url as string;
			expect(calledUrl).toContain('/builds/triggers/trigger-123/builds');
			expect(mockAxiosRequest.mock.calls[1]![0].data).toBe(JSON.stringify({ branch: 'main' }));
		});

		it('should accept clearCache without error and without changing the request (Cloudflare has no build-cache concept)', async () => {
			mockAxiosRequest
				.mockResolvedValueOnce(
					createAxiosResponse(200, {
						success: true,
						result: [{ trigger_uuid: 'trigger-123', branch_includes: ['main'] }],
					}),
				)
				.mockResolvedValueOnce(
					createAxiosResponse(200, {
						success: true,
						result: {
							build_uuid: 'build-123',
							status: 'active',
							created_at: '2026-01-01T00:00:00.000Z',
						},
					}),
				);

			const result = await driver.triggerRun('worker-tag-1', { clearCache: true });

			expect(result.deployment_id).toBe('build-123');
			expect(mockAxiosRequest.mock.calls[1]![0].data).toBe(JSON.stringify({ branch: 'main' }));
		});

		it('should prefer main-branch trigger over wildcard trigger', async () => {
			mockAxiosRequest
				.mockResolvedValueOnce(
					createAxiosResponse(200, {
						success: true,
						result: [
							{
								trigger_uuid: 'non-prod',
								trigger_name: 'Deploy non-production branches',
								branch_includes: ['*'],
								branch_excludes: ['main'],
							},
							{ trigger_uuid: 'prod', trigger_name: 'Deploy default branch', branch_includes: ['main'] },
						],
					}),
				)
				.mockResolvedValueOnce(
					createAxiosResponse(200, {
						success: true,
						result: { build_uuid: 'build-456', status: 'active', created_at: '2026-01-01T00:00:00.000Z' },
					}),
				);

			const result = await driver.triggerRun('worker-tag-1');

			expect(result.deployment_id).toBe('build-456');
			const calledUrl = mockAxiosRequest.mock.calls[1]![0].url as string;
			expect(calledUrl).toContain('/builds/triggers/prod/builds');
			expect(mockAxiosRequest.mock.calls[1]![0].data).toBe(JSON.stringify({ branch: 'main' }));
		});

		it('should throw InvalidProviderConfigError when trigger branch cannot be resolved', async () => {
			mockAxiosRequest.mockResolvedValueOnce(
				createAxiosResponse(200, {
					success: true,
					result: [{ trigger_uuid: 'trigger-123', branch_includes: ['*'] }],
				}),
			);

			await expect(driver.triggerRun('worker-tag-1')).rejects.toThrow(InvalidProviderConfigError);
		});

		it('should throw InvalidProviderConfigError when no trigger is available', async () => {
			mockAxiosRequest.mockResolvedValueOnce(
				createAxiosResponse(200, {
					success: true,
					result: [],
				}),
			);

			await expect(driver.triggerRun('worker-tag-1')).rejects.toThrow(InvalidProviderConfigError);
		});
	});

	describe('registerWebhook', () => {
		it('should return an empty result without making any requests (Cloudflare pushes no webhooks)', async () => {
			const result = await driver.registerWebhook('https://example.com/hooks', ['worker-tag-1', 'worker-tag-2']);

			expect(result).toEqual({ webhook_ids: [], webhook_secret: '' });
			expect(mockAxiosRequest).not.toHaveBeenCalled();
		});

		it('should return an empty result when no project ids are given', async () => {
			const result = await driver.registerWebhook('https://example.com/hooks', []);

			expect(result).toEqual({ webhook_ids: [], webhook_secret: '' });
			expect(mockAxiosRequest).not.toHaveBeenCalled();
		});
	});

	describe('getRunLogs', () => {
		it('should return mapped logs from build logs endpoint', async () => {
			const ts1 = 1704067200000;
			const ts2 = 1704067201000;

			mockAxiosRequest.mockResolvedValueOnce(
				createAxiosResponse(200, {
					success: true,
					result: {
						lines: [
							[ts1, 'Build started'],
							[ts2, 'Build warning'],
						],
						events: [],
					},
				}),
			);

			const logs = await driver.getRunLogs('build-123');

			expect(logs).toEqual([
				{ timestamp: new Date(ts1), type: 'stdout', message: 'Build started' },
				{ timestamp: new Date(ts2), type: 'stdout', message: 'Build warning' },
			]);
		});

		it('should filter logs by since option', async () => {
			const ts1 = 1704067200000;
			const ts2 = 1704067201000;

			mockAxiosRequest.mockResolvedValueOnce(
				createAxiosResponse(200, {
					success: true,
					result: {
						lines: [
							[ts1, 'Build started'],
							[ts2, 'Build warning'],
						],
						events: [],
					},
				}),
			);

			const logs = await driver.getRunLogs('build-123', { since: new Date(ts2) });

			expect(logs).toEqual([{ timestamp: new Date(ts2), type: 'stdout', message: 'Build warning' }]);
		});
	});

	describe('queue events', () => {
		it('should parse queue event into deployment webhook event', () => {
			const parsed = driver.parseQueueEvent({
				type: 'cf.workersBuilds.worker.build.succeeded',
				source: { workerName: 'worker-tag-1' },
				payload: {
					buildUuid: 'build-123',
					status: 'success',
					buildOutcome: 'success',
					createdAt: '2026-01-01T00:00:00.000Z',
					buildTriggerMetadata: { branch: 'main' },
				},
				metadata: {
					eventTimestamp: '2026-01-01T00:01:00.000Z',
				},
			});

			expect(parsed).toEqual({
				type: 'deployment.succeeded',
				provider: 'cloudflare-workers',
				project_external_id: 'worker-tag-1',
				deployment_external_id: 'build-123',
				status: 'ready',
				target: 'main',
				timestamp: new Date('2026-01-01T00:01:00.000Z'),
				raw: expect.any(Object),
			});
		});

		it('should parse Workers Builds event subscription shape (source.type + metadata fields)', () => {
			const parsed = driver.parseQueueEvent({
				type: 'cf.workersBuilds.worker.build.started',
				source: { type: 'workersBuilds.worker', workerName: 'my-worker' },
				payload: {
					buildUuid: 'build-12345678-90ab-cdef-1234-567890abcdef',
					status: 'running',
					buildOutcome: null,
					createdAt: '2025-05-01T02:48:57.132Z',
					buildTriggerMetadata: { branch: 'main', buildTriggerSource: 'push_event' },
				},
				metadata: {
					accountId: 'f9f79265f388666de8122cfb508d7776',
					eventSubscriptionId: '1830c4bb612e43c3af7f4cada31fbf3f',
					eventSchemaVersion: 1,
					eventTimestamp: '2025-05-01T02:48:57.132Z',
				},
			});

			expect(parsed?.type).toBe('deployment.created');
			expect(parsed?.status).toBe('building');
			expect(parsed?.project_external_id).toBe('my-worker');
			expect(parsed?.deployment_external_id).toBe('build-12345678-90ab-cdef-1234-567890abcdef');
			expect(parsed?.target).toBe('main');
		});

		it('should map build.failed payload with buildOutcome "failure" to error status', () => {
			const parsed = driver.parseQueueEvent({
				type: 'cf.workersBuilds.worker.build.failed',
				source: { type: 'workersBuilds.worker', workerName: 'my-worker' },
				payload: {
					buildUuid: 'build-12345678-90ab-cdef-1234-567890abcdef',
					status: 'failed',
					buildOutcome: 'failure',
					buildTriggerMetadata: { branch: 'main' },
				},
				metadata: { eventTimestamp: '2025-05-01T02:50:00.132Z' },
			});

			expect(parsed?.type).toBe('deployment.error');
			expect(parsed?.status).toBe('error');
		});

		it('should parse base64 JSON queue body when CF-Content-Type is json', () => {
			const payload = {
				type: 'cf.workersbuilds.worker.build.succeeded',
				source: { workerName: 'w1' },
				payload: { buildUuid: 'b1', status: 'success', buildOutcome: 'success' },
			};

			const b64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64');

			const parsed = driver.parseQueueMessage({
				id: '1',
				lease_id: 'l1',
				body: b64,
				metadata: { 'CF-Content-Type': 'json' },
			});

			expect(parsed?.deployment_external_id).toBe('b1');
			expect(parsed?.project_external_id).toBe('w1');
		});
	});

	describe('pullQueueMessages', () => {
		it('should pull messages from Cloudflare Queues REST API when events_queue_id is set', async () => {
			const queueDriver = new CloudflareDriver(
				{ api_token: 'test-token' },
				{
					account_id: accountId,
					events_queue_id: 'queue-id-abc',
				},
			);

			mockAxiosRequest.mockResolvedValueOnce(
				createAxiosResponse(200, {
					success: true,
					result: {
						messages: [{ id: 'm1', lease_id: 'lease-1', body: { hello: 'world' } }],
					},
				}),
			);

			const messages = await queueDriver.pullQueueMessages();
			expect(messages).toEqual([{ id: 'm1', lease_id: 'lease-1', body: { hello: 'world' } }]);

			expect(mockAxiosRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'POST',
					headers: expect.objectContaining({
						Authorization: 'Bearer test-token',
					}),
				}),
			);

			const calledUrl = mockAxiosRequest.mock.calls[0]![0].url as string;
			expect(calledUrl).toContain(`accounts/${accountId}/queues/queue-id-abc/messages/pull`);
		});

		it('should use the main api_token for Queues pull', async () => {
			const queueDriver = new CloudflareDriver(
				{ api_token: 'test-token' },
				{
					account_id: accountId,
					events_queue_id: 'q1',
				},
			);

			mockAxiosRequest.mockResolvedValueOnce(createAxiosResponse(200, { success: true, result: { messages: [] } }));

			await queueDriver.pullQueueMessages();

			expect(mockAxiosRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					headers: expect.objectContaining({
						Authorization: 'Bearer test-token',
					}),
				}),
			);
		});

		it('should return empty array when events_queue_id is not configured', async () => {
			const messages = await driver.pullQueueMessages();
			expect(messages).toEqual([]);
			expect(mockAxiosRequest).not.toHaveBeenCalled();
		});
	});

	describe('deploy hook trigger', () => {
		function driverWithSavedHook(hookUrl: string, projectTag = 'worker-tag-1') {
			return new CloudflareDriver(
				{ api_token: 'test-token' },
				{
					account_id: accountId,
					deploy_hooks_by_project: {
						[projectTag]: [{ name: 'Test', url: hookUrl }],
					},
				},
			);
		}

		it('should trigger deployment via deploy hook URL (unauthenticated POST)', async () => {
			const hookUrl = 'https://api.cloudflare.com/client/v4/workers/builds/deploy_hooks/abc123';
			const hookDriver = driverWithSavedHook(hookUrl);

			mockAxiosRequest.mockResolvedValueOnce(
				createAxiosResponse(200, {
					success: true,
					result: {
						build_uuid: 'hook-build-789',
						branch: 'main',
						worker: 'my-worker',
					},
				}),
			);

			const result = await hookDriver.triggerRun('worker-tag-1', { deployHookUrl: hookUrl });

			expect(result.deployment_id).toBe('hook-build-789');
			expect(result.status).toBe('building');

			const call = mockAxiosRequest.mock.calls[0]![0];
			expect(call.method).toBe('POST');
			expect(call.url).toContain('workers/builds/deploy_hooks/abc123');
			expect(call.headers?.Authorization).toBeUndefined();
		});

		it('should throw ServiceUnavailableError when deploy hook returns error', async () => {
			const hookUrl = 'https://api.cloudflare.com/client/v4/workers/builds/deploy_hooks/bad-hook';
			const hookDriver = driverWithSavedHook(hookUrl);

			mockAxiosRequest.mockResolvedValueOnce(
				createAxiosResponse(404, {
					success: false,
					errors: [{ message: 'Not found' }],
				}),
			);

			await expect(hookDriver.triggerRun('worker-tag-1', { deployHookUrl: hookUrl })).rejects.toThrow(
				ServiceUnavailableError,
			);
		});

		it('should reject deploy_hook_url that is not among hooks saved for this worker', async () => {
			const hookDriver = driverWithSavedHook(
				'https://api.cloudflare.com/client/v4/workers/builds/deploy_hooks/allowed-only',
			);

			await expect(
				hookDriver.triggerRun('worker-tag-1', {
					deployHookUrl: 'https://api.cloudflare.com/client/v4/workers/builds/deploy_hooks/different',
				}),
			).rejects.toThrow(InvalidPayloadError);
		});

		it('should use trigger API when no deployHookUrl is provided', async () => {
			mockAxiosRequest
				.mockResolvedValueOnce(
					createAxiosResponse(200, {
						success: true,
						result: [{ trigger_uuid: 'trigger-123', branch_includes: ['main'] }],
					}),
				)
				.mockResolvedValueOnce(
					createAxiosResponse(200, {
						success: true,
						result: {
							build_uuid: 'build-123',
							status: 'active',
							created_at: '2026-01-01T00:00:00.000Z',
						},
					}),
				);

			const result = await driver.triggerRun('worker-tag-1');

			expect(result.deployment_id).toBe('build-123');
			const calledUrl = mockAxiosRequest.mock.calls[1]![0].url as string;
			expect(calledUrl).toContain('/builds/triggers/trigger-123/builds');
		});

		it('should extract build_uuid from deploy hook response with already_exists flag', async () => {
			const hookUrl = 'https://api.cloudflare.com/client/v4/workers/builds/deploy_hooks/abc123';
			const hookDriver = driverWithSavedHook(hookUrl);

			mockAxiosRequest.mockResolvedValueOnce(
				createAxiosResponse(200, {
					success: true,
					result: {
						build_uuid: 'existing-build-456',
						status: 'queued',
						created_on: '2026-01-21T18:50:00Z',
						already_exists: true,
					},
				}),
			);

			const result = await hookDriver.triggerRun('worker-tag-1', { deployHookUrl: hookUrl });

			expect(result.deployment_id).toBe('existing-build-456');
		});
	});
});
