import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
	mockScheduleSynchronizedJob,
	mockJobStop,
	mockConsume,
	mockTryReadByProvider,
	mockGetWebhookConfig,
	mockLoggerWarn,
} = vi.hoisted(() => {
	const mockJobStop = vi.fn().mockResolvedValue(undefined);
	const mockScheduleSynchronizedJob = vi.fn().mockReturnValue({ stop: mockJobStop });
	const mockConsume = vi.fn().mockResolvedValue(undefined);
	const mockTryReadByProvider = vi.fn();
	const mockGetWebhookConfig = vi.fn();
	const mockLoggerWarn = vi.fn();

	return {
		mockScheduleSynchronizedJob,
		mockJobStop,
		mockConsume,
		mockTryReadByProvider,
		mockGetWebhookConfig,
		mockLoggerWarn,
	};
});

vi.mock('@directus/env', () => ({
	useEnv: vi.fn().mockReturnValue({
		DEPLOYMENT_CLOUDFLARE_QUEUE_POLL_SCHEDULE: '*/5 * * * *',
	}),
}));

vi.mock('../database/index.js', () => ({ default: vi.fn(() => ({})) }));
vi.mock('../utils/get-schema.js', () => ({ getSchema: vi.fn().mockResolvedValue({}) }));

vi.mock('../deployment/cloudflare-queue-consumer.js', () => ({
	consumeCloudflareQueueEvents: mockConsume,
}));

vi.mock('../services/deployment.js', () => ({
	DeploymentService: vi.fn().mockImplementation(() => ({
		tryReadByProvider: mockTryReadByProvider,
		getWebhookConfig: mockGetWebhookConfig,
	})),
}));

vi.mock('../utils/schedule.js', () => ({
	scheduleSynchronizedJob: mockScheduleSynchronizedJob,
}));

vi.mock('../logger/index.js', () => ({
	useLogger: vi.fn(() => ({ warn: mockLoggerWarn, info: vi.fn(), error: vi.fn() })),
}));

describe('cloudflare-queue-consumer schedule', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		mockTryReadByProvider.mockResolvedValue(null);

		const { refreshCloudflareQueueConsumer } = await import('./cloudflare-queue-consumer.js');
		await refreshCloudflareQueueConsumer();
	});

	afterEach(async () => {
		mockTryReadByProvider.mockResolvedValue(null);

		const { refreshCloudflareQueueConsumer } = await import('./cloudflare-queue-consumer.js');
		await refreshCloudflareQueueConsumer();
	});

	it('does not register a job and does not log when Cloudflare is not configured', async () => {
		const { default: scheduleCloudflareQueueConsumer } = await import('./cloudflare-queue-consumer.js');

		const result = await scheduleCloudflareQueueConsumer();

		expect(result).toBe(false);
		expect(mockScheduleSynchronizedJob).not.toHaveBeenCalled();
		expect(mockLoggerWarn).not.toHaveBeenCalled();
	});

	it('logs a warning and does not register a job when getWebhookConfig fails unexpectedly', async () => {
		mockTryReadByProvider.mockResolvedValueOnce({ id: 'deploy-1' });
		mockGetWebhookConfig.mockRejectedValueOnce(new Error('DB connection lost'));

		const { default: scheduleCloudflareQueueConsumer } = await import('./cloudflare-queue-consumer.js');

		const result = await scheduleCloudflareQueueConsumer();

		expect(result).toBe(false);
		expect(mockScheduleSynchronizedJob).not.toHaveBeenCalled();

		expect(mockLoggerWarn).toHaveBeenCalledWith(
			new Error('DB connection lost'),
			expect.stringContaining('Failed to initialize queue consumer schedule'),
		);
	});

	it('does not register a job when events_queue_id is missing', async () => {
		mockTryReadByProvider.mockResolvedValueOnce({ id: 'deploy-1' });

		mockGetWebhookConfig.mockResolvedValueOnce({
			credentials: { api_token: 'token' },
			options: { account_id: 'abc', events_queue_id: '   ' },
		});

		const { default: scheduleCloudflareQueueConsumer } = await import('./cloudflare-queue-consumer.js');

		const result = await scheduleCloudflareQueueConsumer();

		expect(result).toBe(false);
		expect(mockScheduleSynchronizedJob).not.toHaveBeenCalled();
	});

	it('registers a job when events_queue_id is set', async () => {
		mockTryReadByProvider.mockResolvedValueOnce({ id: 'deploy-1' });

		mockGetWebhookConfig.mockResolvedValueOnce({
			credentials: { api_token: 'token' },
			options: { account_id: 'abc', events_queue_id: 'queue-123' },
		});

		const { default: scheduleCloudflareQueueConsumer } = await import('./cloudflare-queue-consumer.js');

		const result = await scheduleCloudflareQueueConsumer();

		expect(result).toBe(true);
		expect(mockScheduleSynchronizedJob).toHaveBeenCalledTimes(1);

		expect(mockScheduleSynchronizedJob).toHaveBeenCalledWith(
			'deployment-cloudflare-queue-consumer',
			'*/5 * * * *',
			expect.any(Function),
		);
	});

	it('stops an existing job and re-registers on a second schedule call', async () => {
		mockTryReadByProvider.mockResolvedValue({ id: 'deploy-1' });

		mockGetWebhookConfig.mockResolvedValue({
			credentials: { api_token: 'token' },
			options: { account_id: 'abc', events_queue_id: 'queue-123' },
		});

		const { default: scheduleCloudflareQueueConsumer } = await import('./cloudflare-queue-consumer.js');

		await scheduleCloudflareQueueConsumer();
		await scheduleCloudflareQueueConsumer();

		expect(mockJobStop).toHaveBeenCalledTimes(1);
		expect(mockScheduleSynchronizedJob).toHaveBeenCalledTimes(2);
	});

	it('refreshCloudflareQueueConsumer stops then registers again', async () => {
		mockTryReadByProvider.mockResolvedValue({ id: 'deploy-1' });

		mockGetWebhookConfig.mockResolvedValue({
			credentials: { api_token: 'token' },
			options: { account_id: 'abc', events_queue_id: 'queue-123' },
		});

		const { refreshCloudflareQueueConsumer } = await import('./cloudflare-queue-consumer.js');

		await refreshCloudflareQueueConsumer();
		await refreshCloudflareQueueConsumer();

		expect(mockJobStop).toHaveBeenCalledTimes(1);
		expect(mockScheduleSynchronizedJob).toHaveBeenCalledTimes(2);
	});

	it('refreshCloudflareQueueConsumer leaves job stopped when queue id is cleared', async () => {
		mockTryReadByProvider.mockResolvedValue({ id: 'deploy-1' });

		mockGetWebhookConfig
			.mockResolvedValueOnce({
				credentials: { api_token: 'token' },
				options: { account_id: 'abc', events_queue_id: 'queue-123' },
			})
			.mockResolvedValueOnce({
				credentials: { api_token: 'token' },
				options: { account_id: 'abc' },
			});

		const { refreshCloudflareQueueConsumer } = await import('./cloudflare-queue-consumer.js');

		await refreshCloudflareQueueConsumer();
		expect(mockScheduleSynchronizedJob).toHaveBeenCalledTimes(1);

		await refreshCloudflareQueueConsumer();
		expect(mockJobStop).toHaveBeenCalledTimes(1);
		expect(mockScheduleSynchronizedJob).toHaveBeenCalledTimes(1);
	});

	describe('scheduled tick', () => {
		const getTickCallback = () => mockScheduleSynchronizedJob.mock.calls[0]![2] as () => Promise<void>;

		beforeEach(() => {
			mockTryReadByProvider.mockResolvedValue({ id: 'deploy-1' });

			mockGetWebhookConfig.mockResolvedValue({
				credentials: { api_token: 'token' },
				options: { account_id: 'abc', events_queue_id: 'queue-123' },
			});
		});

		it('reloads config on every tick and passes the current deploymentId and driver', async () => {
			const { default: scheduleCloudflareQueueConsumer } = await import('./cloudflare-queue-consumer.js');
			await scheduleCloudflareQueueConsumer();

			// The initial load happens during registration — a tick must reload rather than reuse it.
			const callsAtRegistration = mockTryReadByProvider.mock.calls.length;

			await getTickCallback()();

			expect(mockTryReadByProvider.mock.calls.length).toBe(callsAtRegistration + 1);
			expect(mockConsume).toHaveBeenCalledWith('deploy-1', expect.any(Object));
		});

		it('no-ops on a tick when the config was removed since registration', async () => {
			const { default: scheduleCloudflareQueueConsumer } = await import('./cloudflare-queue-consumer.js');
			await scheduleCloudflareQueueConsumer();

			mockTryReadByProvider.mockResolvedValueOnce(null);

			await getTickCallback()();

			expect(mockConsume).not.toHaveBeenCalled();
		});

		it('logs a warning and does not throw when reloading config fails mid-tick', async () => {
			const { default: scheduleCloudflareQueueConsumer } = await import('./cloudflare-queue-consumer.js');
			await scheduleCloudflareQueueConsumer();

			mockGetWebhookConfig.mockRejectedValueOnce(new Error('DB connection lost'));

			await expect(getTickCallback()()).resolves.toBeUndefined();

			expect(mockConsume).not.toHaveBeenCalled();

			expect(mockLoggerWarn).toHaveBeenCalledWith(
				new Error('DB connection lost'),
				expect.stringContaining('Failed to reload queue consumer config'),
			);
		});

		it('does not log when consumeCloudflareQueueEvents completes on tick', async () => {
			const { default: scheduleCloudflareQueueConsumer } = await import('./cloudflare-queue-consumer.js');
			await scheduleCloudflareQueueConsumer();

			mockConsume.mockResolvedValueOnce(undefined);

			await expect(getTickCallback()()).resolves.toBeUndefined();

			expect(mockConsume).toHaveBeenCalled();
			expect(mockLoggerWarn).not.toHaveBeenCalled();
		});
	});
});
