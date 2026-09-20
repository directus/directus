import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useBus } from '../bus/index.js';
import { useLogger } from '../logger/index.js';
import { createMockBus } from '../test-utils/bus.js';
import { waitForBusMessage } from './wait-for-bus-message.js';

vi.mock('../bus/index.js');
vi.mock('../logger/index.js');

describe('waitForBusMessage', () => {
	let testBus: ReturnType<typeof createMockBus>;
	let logger: { warn: ReturnType<typeof vi.fn> };

	beforeEach(() => {
		vi.useFakeTimers();

		testBus = createMockBus();
		logger = { warn: vi.fn() };

		vi.mocked(useBus).mockReturnValue(testBus.bus as any);
		vi.mocked(useLogger).mockReturnValue(logger as any);
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.clearAllMocks();
	});

	test('should subscribe before returning', async () => {
		await waitForBusMessage('channel');

		expect(testBus.subscriberCount('channel')).toBe(1);
	});

	test('should resolve with the next message and unsubscribe', async () => {
		const { done } = await waitForBusMessage<string>('channel');

		await testBus.bus.publish('channel', 'payload');

		await expect(done()).resolves.toBe('payload');
		expect(testBus.subscriberCount('channel')).toBe(0);
	});

	test('should hold on to a message that arrives before the wait begins', async () => {
		const { done } = await waitForBusMessage<string>('channel');

		// Whatever the caller was doing in between, the message was already theirs
		await testBus.bus.publish('channel', 'payload');
		await vi.advanceTimersByTimeAsync(0);

		await expect(done()).resolves.toBe('payload');
	});

	test('should reject and unsubscribe on timeout', async () => {
		const { done } = await waitForBusMessage('channel', { timeout: 1000 });

		const timedOut = expect(done()).rejects.toThrow('Timed out after 1000ms waiting for a message on "channel"');

		await vi.advanceTimersByTimeAsync(1000);
		await timedOut;

		expect(testBus.subscriberCount('channel')).toBe(0);
	});

	test('should unsubscribe on cancel', async () => {
		const { cancel } = await waitForBusMessage('channel');

		await cancel();

		expect(testBus.subscriberCount('channel')).toBe(0);
	});

	test('should skip messages that are not accepted', async () => {
		const { done } = await waitForBusMessage<string, 'accepted'>('channel', {
			accept: (payload): payload is 'accepted' => payload === 'accepted',
		});

		await testBus.bus.publish('channel', 'ignored');
		await testBus.bus.publish('channel', 'accepted');

		await expect(done()).resolves.toBe('accepted');
	});

	test('should leave no pending timer once a message arrives', async () => {
		const { done } = await waitForBusMessage('channel');

		await testBus.bus.publish('channel', 'payload');
		await done();

		expect(vi.getTimerCount()).toBe(0);
	});

	test('should log, not reject, when the listener cannot be released', async () => {
		testBus.bus.unsubscribe.mockRejectedValue(new Error('bus unavailable'));

		const { cancel } = await waitForBusMessage('channel');

		await expect(cancel()).resolves.toBeUndefined();

		expect(logger.warn).toHaveBeenCalledWith(expect.any(Error), 'Could not release the bus listener for "channel"');
	});
});
