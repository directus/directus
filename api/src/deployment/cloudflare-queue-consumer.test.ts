import { beforeEach, describe, expect, it, vi } from 'vitest';
import { consumeCloudflareQueueEvents } from './cloudflare-queue-consumer.js';

const {
	MockCloudflareDriverCtor,
	mockPullQueueMessages,
	mockAckQueueMessages,
	mockParseQueueMessage,
	mockReadByProviderReference,
	mockProcessWebhookEvent,
	mockLoggerInfo,
	mockLoggerDebug,
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
		mockReadByProviderReference: vi.fn(),
		mockProcessWebhookEvent: vi.fn(),
		mockLoggerInfo: vi.fn(),
		mockLoggerDebug: vi.fn(),
		mockLoggerWarn: vi.fn(),
	};
});

vi.mock('../database/index.js', () => ({ default: vi.fn(() => ({})) }));
vi.mock('../utils/get-schema.js', () => ({ getSchema: vi.fn().mockResolvedValue({}) }));

vi.mock('./drivers/cloudflare.js', () => ({
	CloudflareDriver: MockCloudflareDriverCtor,
}));

vi.mock('../logger/index.js', () => ({
	useLogger: vi.fn(() => ({
		info: mockLoggerInfo,
		debug: mockLoggerDebug,
		warn: mockLoggerWarn,
	})),
}));

vi.mock('../services/deployment-projects.js', () => ({
	DeploymentProjectsService: vi.fn().mockImplementation(() => ({
		readByProviderReference: mockReadByProviderReference,
	})),
}));

vi.mock('../services/deployment-runs.js', () => ({
	DeploymentRunsService: vi.fn().mockImplementation(() => ({
		processWebhookEvent: mockProcessWebhookEvent,
	})),
}));

const defaultDeploymentId = 'deploy-1';

const makeDriver = () => new MockCloudflareDriverCtor();

const call = () => consumeCloudflareQueueEvents(defaultDeploymentId, makeDriver());

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
		mockPullQueueMessages.mockResolvedValue([]);
		mockAckQueueMessages.mockResolvedValue(undefined);
	});

	it('should return early without acking when queue is empty', async () => {
		mockPullQueueMessages.mockResolvedValueOnce([]);

		await call();

		expect(mockReadByProviderReference).not.toHaveBeenCalled();
		expect(mockAckQueueMessages).not.toHaveBeenCalled();
	});

	it('should debug and return when pullQueueMessages fails', async () => {
		mockPullQueueMessages.mockRejectedValueOnce(new Error('Queue API error'));

		await call();

		expect(mockLoggerDebug).toHaveBeenCalledWith(
			new Error('Queue API error'),
			expect.stringContaining('Queues API pull failed'),
		);

		expect(mockAckQueueMessages).not.toHaveBeenCalled();
	});

	it('should ack and warn when parseQueueMessage returns null (unrecognized event)', async () => {
		const msg = makeMessage('lease-1');
		mockPullQueueMessages.mockResolvedValueOnce([msg]);
		mockParseQueueMessage.mockReturnValueOnce(null);

		await call();

		expect(mockAckQueueMessages).toHaveBeenCalledWith(['lease-1'], []);
		expect(mockLoggerDebug).toHaveBeenCalledWith(expect.stringContaining('Dropping message'));
	});

	it('should retry and warn when parseQueueMessage throws', async () => {
		const msg = makeMessage('lease-1');
		mockPullQueueMessages.mockResolvedValueOnce([msg]);

		mockParseQueueMessage.mockImplementationOnce(() => {
			throw new Error('parse error');
		});

		await call();

		expect(mockAckQueueMessages).toHaveBeenCalledWith([], ['lease-1']);

		expect(mockLoggerWarn).toHaveBeenCalledWith(
			new Error('parse error'),
			expect.stringContaining('Failed to parse event'),
		);
	});

	it('should ack and warn when no matching project is found', async () => {
		const msg = makeMessage('lease-1');
		mockPullQueueMessages.mockResolvedValueOnce([msg]);
		mockParseQueueMessage.mockReturnValueOnce(makeEvent());
		mockReadByProviderReference.mockResolvedValueOnce(null);

		await call();

		expect(mockProcessWebhookEvent).not.toHaveBeenCalled();
		expect(mockAckQueueMessages).toHaveBeenCalledWith(['lease-1'], []);
		expect(mockLoggerDebug).toHaveBeenCalledWith(expect.stringContaining('No Directus deployment project'));
	});

	it('should process event via the shared run-reconciliation service and ack on success', async () => {
		const msg = makeMessage('lease-1');
		const event = makeEvent();
		const project = { id: 'project-1', name: 'my-worker' };

		mockPullQueueMessages.mockResolvedValueOnce([msg]);
		mockParseQueueMessage.mockReturnValueOnce(event);
		mockReadByProviderReference.mockResolvedValueOnce(project);
		mockProcessWebhookEvent.mockResolvedValueOnce('run-1');

		await call();

		expect(mockProcessWebhookEvent).toHaveBeenCalledWith('project-1', event);
		expect(mockAckQueueMessages).toHaveBeenCalledWith(['lease-1'], []);
	});

	it('should retry and warn when processWebhookEvent throws', async () => {
		const msg = makeMessage('lease-1');
		mockPullQueueMessages.mockResolvedValueOnce([msg]);
		mockParseQueueMessage.mockReturnValueOnce(makeEvent());
		mockReadByProviderReference.mockResolvedValueOnce({ id: 'project-1' });
		mockProcessWebhookEvent.mockRejectedValueOnce(new Error('DB error'));

		await call();

		expect(mockAckQueueMessages).toHaveBeenCalledWith([], ['lease-1']);

		expect(mockLoggerWarn).toHaveBeenCalledWith(
			new Error('DB error'),
			expect.stringContaining('Failed to process event'),
		);
	});

	it('should log message count at debug when messages are pulled', async () => {
		const messages = [makeMessage('lease-1'), makeMessage('lease-2')];

		mockPullQueueMessages.mockResolvedValueOnce(messages);
		mockParseQueueMessage.mockReturnValue(null);

		await call();

		expect(mockLoggerDebug).toHaveBeenCalledWith(expect.stringContaining('2 message(s)'));
		expect(mockLoggerInfo).not.toHaveBeenCalled();
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

		mockReadByProviderReference.mockResolvedValueOnce(project);
		mockProcessWebhookEvent.mockResolvedValueOnce('run-1');

		await call();

		expect(mockAckQueueMessages).toHaveBeenCalledWith(expect.arrayContaining(['lease-1', 'lease-2']), ['lease-3']);
	});
});
