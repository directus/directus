import { beforeEach, describe, expect, it, vi } from 'vitest';
import { consumeCloudflareQueueEvents } from './cloudflare-queue-consumer.js';

const {
	MockCloudflareDriverCtor,
	mockPullQueueMessages,
	mockAckQueueMessages,
	mockParseQueueMessage,
	mockReadByProvider,
	mockGetWebhookConfig,
	mockProjectsReadByQuery,
	mockProcessWebhookEvent,
	mockEmitAction,
	mockLoggerDebug,
	mockLoggerInfo,
	mockLoggerWarn,
} = vi.hoisted(() => {
	const mockPullQueueMessages = vi.fn();
	const mockAckQueueMessages = vi.fn().mockResolvedValue(undefined);
	const mockParseQueueMessage = vi.fn();

	// Use non-arrow function so `new` creates a proper instance and instanceof works
	const MockCloudflareDriverCtor = vi.fn().mockImplementation(function (this: any) {
		this.pullQueueMessages = mockPullQueueMessages;
		this.ackQueueMessages = mockAckQueueMessages;
		this.parseQueueMessage = mockParseQueueMessage;
	});

	return {
		MockCloudflareDriverCtor,
		mockPullQueueMessages,
		mockAckQueueMessages,
		mockParseQueueMessage,
		mockReadByProvider: vi.fn(),
		mockGetWebhookConfig: vi.fn(),
		mockProjectsReadByQuery: vi.fn(),
		mockProcessWebhookEvent: vi.fn(),
		mockEmitAction: vi.fn(),
		mockLoggerDebug: vi.fn(),
		mockLoggerInfo: vi.fn(),
		mockLoggerWarn: vi.fn(),
	};
});

vi.mock('../database/index.js', () => ({ default: vi.fn(() => ({})) }));
vi.mock('../utils/get-schema.js', () => ({ getSchema: vi.fn().mockResolvedValue({}) }));

vi.mock('../deployment/drivers/cloudflare.js', () => ({
	CloudflareDriver: MockCloudflareDriverCtor,
}));

vi.mock('../deployment.js', () => ({
	getDeploymentDriver: vi.fn(() => new MockCloudflareDriverCtor()),
}));

vi.mock('../emitter.js', () => ({
	default: { emitAction: mockEmitAction },
}));

vi.mock('../logger/index.js', () => ({
	useLogger: vi.fn(() => ({
		debug: mockLoggerDebug,
		info: mockLoggerInfo,
		warn: mockLoggerWarn,
	})),
}));

vi.mock('./deployment.js', () => ({
	DeploymentService: vi.fn().mockImplementation(() => ({
		readByProvider: mockReadByProvider,
		getWebhookConfig: mockGetWebhookConfig,
	})),
}));

vi.mock('./deployment-projects.js', () => ({
	DeploymentProjectsService: vi.fn().mockImplementation(() => ({
		readByQuery: mockProjectsReadByQuery,
	})),
}));

vi.mock('./deployment-runs.js', () => ({
	DeploymentRunsService: vi.fn().mockImplementation(() => ({
		processWebhookEvent: mockProcessWebhookEvent,
	})),
}));

const defaultDeploymentRow = { id: 'deploy-1' };

const defaultWebhookConfig = {
	credentials: { api_token: 'test-token' },
	options: { account_id: 'account-1', events_queue_id: 'queue-1' },
	webhook_secret: null,
};

const makeMessage = (leaseId: string, body: any = { type: 'cf.workersBuilds.worker.build.succeeded' }) => ({
	id: `msg-${leaseId}`,
	lease_id: leaseId,
	body,
});

const makeEvent = (overrides: Record<string, any> = {}): any => ({
	type: 'deployment.succeeded',
	provider: 'cloudflare-workers',
	project_external_id: 'my-worker',
	deployment_external_id: 'build-123',
	status: 'ready',
	timestamp: new Date(),
	...overrides,
});

describe('consumeCloudflareQueueEvents', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockReadByProvider.mockResolvedValue(defaultDeploymentRow);
		mockGetWebhookConfig.mockResolvedValue(defaultWebhookConfig);
		mockPullQueueMessages.mockResolvedValue([]);
		mockAckQueueMessages.mockResolvedValue(undefined);
	});

	it('should return early and log when no cloudflare-workers deployment config exists', async () => {
		mockReadByProvider.mockRejectedValueOnce(new Error('Deployment config not found'));

		await expect(consumeCloudflareQueueEvents()).resolves.toBeUndefined();

		expect(mockPullQueueMessages).not.toHaveBeenCalled();
		expect(mockLoggerDebug).toHaveBeenCalledWith(expect.stringContaining('Not running'));
	});

	it('should return early when events_queue_id is not set', async () => {
		mockGetWebhookConfig.mockResolvedValueOnce({
			...defaultWebhookConfig,
			options: { account_id: 'account-1' },
		});

		await consumeCloudflareQueueEvents();

		expect(mockPullQueueMessages).not.toHaveBeenCalled();
	});

	it('should return early when events_queue_id is whitespace-only', async () => {
		mockGetWebhookConfig.mockResolvedValueOnce({
			...defaultWebhookConfig,
			options: { account_id: 'account-1', events_queue_id: '   ' },
		});

		await consumeCloudflareQueueEvents();

		expect(mockPullQueueMessages).not.toHaveBeenCalled();
	});

	it('should return early without acking when queue is empty', async () => {
		mockPullQueueMessages.mockResolvedValueOnce([]);

		await consumeCloudflareQueueEvents();

		expect(mockProjectsReadByQuery).not.toHaveBeenCalled();
		expect(mockAckQueueMessages).not.toHaveBeenCalled();
	});

	it('should warn and rethrow when pullQueueMessages fails', async () => {
		mockPullQueueMessages.mockRejectedValueOnce(new Error('Queue API error'));

		await expect(consumeCloudflareQueueEvents()).rejects.toThrow('Queue API error');

		expect(mockLoggerWarn).toHaveBeenCalledWith(expect.stringContaining('Queues API pull failed'));
	});

	it('should ack and warn when parseQueueMessage returns null (unrecognized event)', async () => {
		const msg = makeMessage('lease-1');
		mockPullQueueMessages.mockResolvedValueOnce([msg]);
		mockParseQueueMessage.mockReturnValueOnce(null);

		await consumeCloudflareQueueEvents();

		expect(mockAckQueueMessages).toHaveBeenCalledWith(['lease-1'], []);
		expect(mockLoggerWarn).toHaveBeenCalledWith(expect.stringContaining('Dropping message'));
	});

	it('should retry and warn when parseQueueMessage throws', async () => {
		const msg = makeMessage('lease-1');
		mockPullQueueMessages.mockResolvedValueOnce([msg]);

		mockParseQueueMessage.mockImplementationOnce(() => {
			throw new Error('parse error');
		});

		await consumeCloudflareQueueEvents();

		expect(mockAckQueueMessages).toHaveBeenCalledWith([], ['lease-1']);
		expect(mockLoggerWarn).toHaveBeenCalledWith(expect.stringContaining('Failed to parse event'));
	});

	it('should ack and warn when no matching project is found', async () => {
		const msg = makeMessage('lease-1');
		mockPullQueueMessages.mockResolvedValueOnce([msg]);
		mockParseQueueMessage.mockReturnValueOnce(makeEvent());
		mockProjectsReadByQuery.mockResolvedValueOnce([]);

		await consumeCloudflareQueueEvents();

		expect(mockProcessWebhookEvent).not.toHaveBeenCalled();
		expect(mockAckQueueMessages).toHaveBeenCalledWith(['lease-1'], []);
		expect(mockLoggerWarn).toHaveBeenCalledWith(expect.stringContaining('No Directus deployment project'));
	});

	it('should process event, emit action, and ack on success', async () => {
		const msg = makeMessage('lease-1');
		const event = makeEvent();
		const project = { id: 'project-1', name: 'my-worker' };

		mockPullQueueMessages.mockResolvedValueOnce([msg]);
		mockParseQueueMessage.mockReturnValueOnce(event);
		mockProjectsReadByQuery.mockResolvedValueOnce([project]);
		mockProcessWebhookEvent.mockResolvedValueOnce('run-1');

		await consumeCloudflareQueueEvents();

		expect(mockProcessWebhookEvent).toHaveBeenCalledWith('project-1', event);

		expect(mockEmitAction).toHaveBeenCalledWith(
			['deployment.webhook', `deployment.webhook.${event.type}`],
			expect.objectContaining({ run_id: 'run-1', project_id: 'project-1' }),
			null,
		);

		expect(mockAckQueueMessages).toHaveBeenCalledWith(['lease-1'], []);
	});

	it('should retry and warn when processWebhookEvent throws', async () => {
		const msg = makeMessage('lease-1');
		mockPullQueueMessages.mockResolvedValueOnce([msg]);
		mockParseQueueMessage.mockReturnValueOnce(makeEvent());
		mockProjectsReadByQuery.mockResolvedValueOnce([{ id: 'project-1' }]);
		mockProcessWebhookEvent.mockRejectedValueOnce(new Error('DB error'));

		await consumeCloudflareQueueEvents();

		expect(mockAckQueueMessages).toHaveBeenCalledWith([], ['lease-1']);
		expect(mockLoggerWarn).toHaveBeenCalledWith(expect.stringContaining('Failed to process event'));
	});

	it('should log message count when messages are pulled', async () => {
		const messages = [makeMessage('lease-1'), makeMessage('lease-2')];

		mockPullQueueMessages.mockResolvedValueOnce(messages);
		mockParseQueueMessage.mockReturnValue(null);

		await consumeCloudflareQueueEvents();

		expect(mockLoggerInfo).toHaveBeenCalledWith(expect.stringContaining('2 message(s)'));
	});

	it('should correctly split acks and retries across multiple messages', async () => {
		const messages = [makeMessage('lease-1'), makeMessage('lease-2'), makeMessage('lease-3')];
		const project = { id: 'project-1' };

		mockPullQueueMessages.mockResolvedValueOnce(messages);

		mockParseQueueMessage
			.mockReturnValueOnce(makeEvent()) // lease-1: success → ack
			.mockReturnValueOnce(null) // lease-2: unrecognized → ack
			.mockImplementationOnce(() => {
				throw new Error('bad');
			}); // lease-3: parse error → retry

		mockProjectsReadByQuery.mockResolvedValueOnce([project]);
		mockProcessWebhookEvent.mockResolvedValueOnce('run-1');

		await consumeCloudflareQueueEvents();

		expect(mockAckQueueMessages).toHaveBeenCalledWith(expect.arrayContaining(['lease-1', 'lease-2']), ['lease-3']);
	});
});
