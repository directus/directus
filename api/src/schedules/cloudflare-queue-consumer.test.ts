import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
	mockScheduleSynchronizedJob,
	mockJobStop,
	mockConsume,
	mockReadByProvider,
	mockGetWebhookConfig,
	mockGetDeploymentDriver,
} = vi.hoisted(() => {
	const mockJobStop = vi.fn().mockResolvedValue(undefined);
	const mockScheduleSynchronizedJob = vi.fn().mockReturnValue({ stop: mockJobStop });
	const mockConsume = vi.fn().mockResolvedValue(undefined);
	const mockReadByProvider = vi.fn();
	const mockGetWebhookConfig = vi.fn();
	const mockGetDeploymentDriver = vi.fn().mockReturnValue({});

	return {
		mockScheduleSynchronizedJob,
		mockJobStop,
		mockConsume,
		mockReadByProvider,
		mockGetWebhookConfig,
		mockGetDeploymentDriver,
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

vi.mock('../deployment.js', () => ({
	getDeploymentDriver: mockGetDeploymentDriver,
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
	useLogger: vi.fn(() => ({ warn: vi.fn(), info: vi.fn(), error: vi.fn() })),
}));

describe('cloudflare-queue-consumer schedule', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		mockReadByProvider.mockRejectedValue(new Error('not configured'));

		const { refreshCloudflareQueueConsumer } = await import('./cloudflare-queue-consumer.js');
		await refreshCloudflareQueueConsumer();
	});

	afterEach(async () => {
		mockReadByProvider.mockRejectedValue(new Error('not configured'));

		const { refreshCloudflareQueueConsumer } = await import('./cloudflare-queue-consumer.js');
		await refreshCloudflareQueueConsumer();
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

	it('stops an existing job and re-registers on a second schedule call', async () => {
		mockReadByProvider.mockResolvedValue({ id: 'deploy-1' });

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
		mockReadByProvider.mockResolvedValue({ id: 'deploy-1' });

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

		const { refreshCloudflareQueueConsumer } = await import('./cloudflare-queue-consumer.js');

		await refreshCloudflareQueueConsumer();
		expect(mockScheduleSynchronizedJob).toHaveBeenCalledTimes(1);

		await refreshCloudflareQueueConsumer();
		expect(mockJobStop).toHaveBeenCalledTimes(1);
		expect(mockScheduleSynchronizedJob).toHaveBeenCalledTimes(1);
	});
});
