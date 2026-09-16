import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useBus } from '../../bus/index.js';
import { useLogger } from '../../logger/index.js';
import { createMockBus } from '../../test-utils/bus.js';
import { waitForBusMessage } from './wait-for-bus-message.js';

vi.mock('../../bus/index.js');
vi.mock('../../logger/index.js');

describe('waitForBusMessage', () => {
	let testBus: ReturnType<typeof createMockBus>;

	beforeEach(() => {
		vi.useFakeTimers();

		testBus = createMockBus();

		vi.mocked(useBus).mockReturnValue(testBus.bus as any);
		vi.mocked(useLogger).mockReturnValue({ warn: vi.fn() } as any);
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.clearAllMocks();
	});

	test('should subscribe before returning', async () => {
		await waitForBusMessage('channel');

		expect(testBus.bus.subscribe).toHaveBeenCalledWith('channel', expect.any(Function));
		expect(testBus.subscriberCount('channel')).toBe(1);
	});

	test('should resolve with the next message and unsubscribe', async () => {
		const { done } = await waitForBusMessage<string>('channel');

		await testBus.bus.publish('channel', 'payload');

		await expect(done()).resolves.toBe('payload');
		expect(testBus.subscriberCount('channel')).toBe(0);
	});

	test('should reject and unsubscribe on timeout', async () => {
		const { done } = await waitForBusMessage('channel', { timeout: 1000 });

		const timedOut = expect(done()).rejects.toThrow('Timeout of 1000ms exceeded');
		await vi.advanceTimersByTimeAsync(1000);
		await timedOut;

		expect(testBus.subscriberCount('channel')).toBe(0);
	});

	test('should unsubscribe on cancel', async () => {
		const { cancel } = await waitForBusMessage('channel');

		await cancel();

		expect(testBus.subscriberCount('channel')).toBe(0);
	});

	test('should ignore an unsubscribe failure', async () => {
		testBus.bus.unsubscribe.mockRejectedValue(new Error('boom'));

		const { cancel } = await waitForBusMessage('channel');

		await expect(cancel()).resolves.toBeUndefined();
	});

	test('should skip messages that are not accepted', async () => {
		const { done } = await waitForBusMessage<string, 'accepted'>('channel', {
			accept: (payload): payload is 'accepted' => payload === 'accepted',
		});

		const message = done();

		await testBus.bus.publish('channel', 'ignored');
		await testBus.bus.publish('channel', 'accepted');

		await expect(message).resolves.toBe('accepted');
	});

	test('should reject with the idle error when no message arrives in time', async () => {
		const { done } = await waitForBusMessage('channel', { timeout: 10_000, idleTimeout: 1000 });

		const stalled = expect(done()).rejects.toThrow('Stalled after 1000ms without message on channel');
		await vi.advanceTimersByTimeAsync(1000);
		await stalled;

		expect(testBus.subscriberCount('channel')).toBe(0);
	});

	test('should start a fresh idle window on every message', async () => {
		const { done } = await waitForBusMessage<string, 'accepted'>('channel', {
			timeout: 10_000,
			idleTimeout: 1000,
			accept: (payload): payload is 'accepted' => payload === 'accepted',
		});

		const message = done();

		for (let beat = 0; beat < 5; beat++) {
			await vi.advanceTimersByTimeAsync(900);
			await testBus.bus.publish('channel', 'ignored');
		}

		await testBus.bus.publish('channel', 'accepted');

		await expect(message).resolves.toBe('accepted');
	});

	test('should not start the idle window before the caller waits', async () => {
		const { cancel } = await waitForBusMessage('channel', { idleTimeout: 1000 });

		await vi.advanceTimersByTimeAsync(5000);

		expect(vi.getTimerCount()).toBe(0);

		await cancel();
	});
});
