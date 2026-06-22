import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
	mockScheduleSynchronizedJob,
	mockJobStop,
	mockConsume,
	mockReadByProvider,
	mockGetWebhookConfig,
	mockLoggerWarn,
} = vi.hoisted(() => {
	const mockJobStop = vi.fn().mockResolvedValue(undefined);
	const mockScheduleSynchronizedJob = vi.fn().mockReturnValue({ stop: mockJobStop });
	const mockConsume = vi.fn().mockResolvedValue(undefined);
	const mockReadByProvider = vi.fn();
	const mockGetWebhookConfig = vi.fn();
	const mockLoggerWarn = vi.fn();

	return {
		mockScheduleSynchronizedJob,
		mockJobStop,
		mockConsume,
		mockReadByProvider,
		mockGetWebhookConfig,
		mockLoggerWarn,
	};
});

vi.mock('@directus/env', () => ({
	useEnv: vi.fn().mockReturnValue({}),
}));

vi.mock('../database/index.js', () => ({ default: vi.fn(() => ({})) }));
vi.mock('../utils/get-schema.js', () => ({ getSchema: vi.fn().mockResolvedValue({}) }));

vi.mock('../deployment/cloudflare-queue-consumer.js', () => ({
	consumeCloudflareQueueEvents: mockConsume,
}));

vi.mock('../services/deployment.js', () => ({
	DeploymentService: vi.fn().mockImplementation(() => ({
		readByProvider: mockReadByProvider,
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
		mockReadByProvider.mockRejectedValue(new Error('not configured'));
	});

	afterEach(async () => {
		const { stopCloudflareQueueConsumer } = await import('./cloudflare-queue-consumer.js');
		await stopCloudflareQueueConsumer();
	});

	it('does not register a job when Cloudflare is not configured', async () => {
		const { default: scheduleCloudflareQueueConsumer } = await import('./cloudflare-queue-consumer.js');

		await scheduleCloudflareQueueConsumer();

		expect(mockScheduleSynchronizedJob).not.toHaveBeenCalled();
	});

	it('does not register a job when events_queue_id is missing', async () => {
		mockReadByProvider.mockResolvedValueOnce({ id: 'deploy-1' });

		mockGetWebhookConfig.mockResolvedValueOnce({
			credentials: { api_token: 'token' },
			options: { account_id: 'abc', events_queue_id: '   ' },
		});

		const { default: scheduleCloudflareQueueConsumer } = await import('./cloudflare-queue-consumer.js');

		await scheduleCloudflareQueueConsumer();

		expect(mockScheduleSynchronizedJob).not.toHaveBeenCalled();
	});

	it('registers a job when events_queue_id is set', async () => {
		mockReadByProvider.mockResolvedValueOnce({ id: 'deploy-1' });

		mockGetWebhookConfig.mockResolvedValueOnce({
			credentials: { api_token: 'token' },
			options: { account_id: 'abc', events_queue_id: 'queue-123' },
		});

		const { default: scheduleCloudflareQueueConsumer } = await import('./cloudflare-queue-consumer.js');

		await scheduleCloudflareQueueConsumer();

		expect(mockScheduleSynchronizedJob).toHaveBeenCalledTimes(1);

		expect(mockScheduleSynchronizedJob).toHaveBeenCalledWith(
			'deployment-cloudflare-queue-consumer',
			'*/5 * * * *',
			expect.any(Function),
		);
	});

	it('does not double-register while a job is already running', async () => {
		mockReadByProvider.mockResolvedValue({ id: 'deploy-1' });

		mockGetWebhookConfig.mockResolvedValue({
			credentials: { api_token: 'token' },
			options: { account_id: 'abc', events_queue_id: 'queue-123' },
		});

		const { default: scheduleCloudflareQueueConsumer } = await import('./cloudflare-queue-consumer.js');

		await scheduleCloudflareQueueConsumer();
		await scheduleCloudflareQueueConsumer();

		expect(mockScheduleSynchronizedJob).toHaveBeenCalledTimes(1);
	});

	it('stopCloudflareQueueConsumer stops the running job', async () => {
		mockReadByProvider.mockResolvedValueOnce({ id: 'deploy-1' });

		mockGetWebhookConfig.mockResolvedValueOnce({
			credentials: { api_token: 'token' },
			options: { account_id: 'abc', events_queue_id: 'queue-123' },
		});

		const { default: scheduleCloudflareQueueConsumer, stopCloudflareQueueConsumer } = await import(
			'./cloudflare-queue-consumer.js'
		);

		await scheduleCloudflareQueueConsumer();
		await stopCloudflareQueueConsumer();

		expect(mockJobStop).toHaveBeenCalledTimes(1);
	});

	it('restartCloudflareQueueConsumer stops then registers again', async () => {
		mockReadByProvider.mockResolvedValue({ id: 'deploy-1' });

		mockGetWebhookConfig.mockResolvedValue({
			credentials: { api_token: 'token' },
			options: { account_id: 'abc', events_queue_id: 'queue-123' },
		});

		const { default: scheduleCloudflareQueueConsumer, restartCloudflareQueueConsumer } = await import(
			'./cloudflare-queue-consumer.js'
		);

		await scheduleCloudflareQueueConsumer();
		await restartCloudflareQueueConsumer();

		expect(mockJobStop).toHaveBeenCalledTimes(1);
		expect(mockScheduleSynchronizedJob).toHaveBeenCalledTimes(2);
	});

	it('restartCloudflareQueueConsumer leaves job stopped when queue id is cleared', async () => {
		mockReadByProvider.mockResolvedValue({ id: 'deploy-1' });

		mockGetWebhookConfig
			.mockResolvedValueOnce({
				credentials: { api_token: 'token' },
				options: { account_id: 'abc', events_queue_id: 'queue-123' },
			})
			.mockResolvedValueOnce({
				credentials: { api_token: 'token' },
				options: { account_id: 'abc' },
			});

		const { restartCloudflareQueueConsumer } = await import('./cloudflare-queue-consumer.js');

		await restartCloudflareQueueConsumer();
		expect(mockScheduleSynchronizedJob).toHaveBeenCalledTimes(1);

		await restartCloudflareQueueConsumer();
		expect(mockJobStop).toHaveBeenCalledTimes(1);
		expect(mockScheduleSynchronizedJob).toHaveBeenCalledTimes(1);
	});

	it('restartCloudflareQueueConsumer logs when scheduling fails', async () => {
		mockReadByProvider.mockResolvedValue({ id: 'deploy-1' });

		mockGetWebhookConfig.mockResolvedValue({
			credentials: { api_token: 'token' },
			options: { account_id: 'abc', events_queue_id: 'queue-123' },
		});

		mockScheduleSynchronizedJob.mockImplementationOnce(() => {
			throw new Error('invalid cron');
		});

		const { restartCloudflareQueueConsumer } = await import('./cloudflare-queue-consumer.js');

		await restartCloudflareQueueConsumer();

		expect(mockLoggerWarn).toHaveBeenCalledWith(expect.stringContaining('Failed to refresh queue consumer schedule'));
	});

	it('restartCloudflareQueueConsumer still schedules when stop throws', async () => {
		mockReadByProvider.mockResolvedValue({ id: 'deploy-1' });

		mockGetWebhookConfig.mockResolvedValue({
			credentials: { api_token: 'token' },
			options: { account_id: 'abc', events_queue_id: 'queue-123' },
		});

		mockJobStop.mockRejectedValueOnce(new Error('clock reset failed'));

		const { default: scheduleCloudflareQueueConsumer, restartCloudflareQueueConsumer } = await import(
			'./cloudflare-queue-consumer.js'
		);

		await scheduleCloudflareQueueConsumer();
		await restartCloudflareQueueConsumer();

		expect(mockLoggerWarn).toHaveBeenCalledWith(expect.stringContaining('Failed to stop queue consumer'));
		expect(mockScheduleSynchronizedJob).toHaveBeenCalledTimes(2);
	});
});
