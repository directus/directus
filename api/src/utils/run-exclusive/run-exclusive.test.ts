import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useBus } from '../../bus/index.js';
import { useLogger } from '../../logger/index.js';
import { withResolvers } from '../../test-utils/async.js';
import { createMockBus } from '../../test-utils/bus.js';
import { createMockStore } from '../../test-utils/store.js';
import { useStore } from '../store.js';
import { runExclusive } from './run-exclusive.js';

vi.mock('../../bus/index.js');
vi.mock('../../logger/index.js');
vi.mock('../store.js');

const CHANNEL = 'directus:exclusive:key:bus';

const HEARTBEAT_INTERVAL = 3333;

/** Matched to the lease ttl, so two missed beats are tolerated */
const HEARTBEAT_TIMEOUT = 10_000;

describe('runExclusive', () => {
	let testBus: ReturnType<typeof createMockBus>;
	let testStore: ReturnType<typeof createMockStore>;
	let logger: { warn: ReturnType<typeof vi.fn> };

	beforeEach(() => {
		vi.useFakeTimers();

		testBus = createMockBus();
		testStore = createMockStore();
		logger = { warn: vi.fn() };

		vi.mocked(useBus).mockReturnValue(testBus.bus as any);
		vi.mocked(useStore).mockReturnValue(testStore.store as any);
		vi.mocked(useLogger).mockReturnValue(logger as any);
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.clearAllMocks();
	});

	async function startLeader() {
		const running = withResolvers();
		const fn = withResolvers<string>();

		const leader = runExclusive('key', () => {
			running.resolve();
			return fn.promise;
		});

		await running.promise;

		return { leader, finish: fn.resolve, fail: fn.reject };
	}

	test('should run fn and report itself as the leader when uncontended', async () => {
		const fn = vi.fn().mockResolvedValue('result');

		await expect(runExclusive('key', fn)).resolves.toEqual({ result: 'result', leader: true });
		expect(fn).toHaveBeenCalledTimes(1);
	});

	test('should run fn once for concurrent callers and share the result', async () => {
		const running = withResolvers();
		const finish = withResolvers<string>();

		const fn = vi.fn(() => {
			running.resolve();
			return finish.promise;
		});

		const outcomes = Promise.all(Array.from({ length: 5 }, () => runExclusive('key', fn)));

		await running.promise;

		// All five have elected, so the leader can finish without any of them arriving late
		await testStore.whenSettled(5);
		finish.resolve('result');

		await expect(outcomes).resolves.toEqual([
			{ result: 'result', leader: true },
			{ result: 'result', leader: false },
			{ result: 'result', leader: false },
			{ result: 'result', leader: false },
			{ result: 'result', leader: false },
		]);

		expect(fn).toHaveBeenCalledTimes(1);
	});

	test('should reject both the leader and its followers when fn keeps failing', async () => {
		const { leader, fail } = await startLeader();

		const follower = runExclusive('key', vi.fn(), { maxAttempts: 1 });

		await testStore.whenSettled(2);
		fail(new Error('boom'));

		await expect(leader).rejects.toMatchObject({ message: 'Exclusive run for "key" failed', cause: 'boom' });
		await expect(follower).rejects.toThrow('boom');
	});

	test('should retry fn up to maxAttempts', async () => {
		const fn = vi.fn().mockRejectedValueOnce(new Error('boom')).mockResolvedValue('result');

		await expect(runExclusive('key', fn, { maxAttempts: 3 })).resolves.toEqual({
			result: 'result',
			leader: true,
		});

		expect(fn).toHaveBeenCalledTimes(2);
	});

	test('should stop retrying fn at maxAttempts', async () => {
		const fn = vi.fn().mockRejectedValue(new Error('boom'));

		await expect(runExclusive('key', fn, { maxAttempts: 2 })).rejects.toThrow('Exclusive run for "key" failed');
		expect(fn).toHaveBeenCalledTimes(2);
	});

	test('should release the lease so a later invocation can lead again', async () => {
		await runExclusive('key', async () => 'first');

		expect(testStore.state.has('leader')).toBe(false);

		const fn = vi.fn().mockResolvedValue('second');

		await expect(runExclusive('key', fn)).resolves.toEqual({ result: 'second', leader: true });
		expect(fn).toHaveBeenCalledTimes(1);
	});

	test('should release the lease when fn fails', async () => {
		const fn = vi.fn().mockRejectedValue(new Error('boom'));

		await expect(runExclusive('key', fn, { maxAttempts: 1 })).rejects.toThrow('Exclusive run for "key" failed');
		expect(testStore.state.has('leader')).toBe(false);
	});

	test('should lead, not wait, when arriving between the release and the publish', async () => {
		const fn = vi.fn().mockResolvedValue('result');
		const arrival = withResolvers<unknown>();

		// Hold the leader inside publish so the arriving caller elects mid-publish. The lease
		// is already released by then, so it has to lead rather than wait for a message that
		// has been handed to subscribers already.
		testBus.setOnPublish(async () => {
			testBus.setOnPublish(undefined);
			arrival.resolve(runExclusive('key', fn));

			// The leader's own election and release account for the first two
			await testStore.whenSettled(3);
		});

		await expect(runExclusive('key', fn)).resolves.toEqual({ result: 'result', leader: true });
		await expect(arrival.promise).resolves.toEqual({ result: 'result', leader: true });
		expect(fn).toHaveBeenCalledTimes(2);
	});

	test('should unsubscribe when the election fails', async () => {
		testStore.fail();

		await expect(runExclusive('key', vi.fn())).rejects.toThrow('store unavailable');

		// The bus is a process-wide singleton, so a stray handler would outlive the call
		expect(testBus.subscriberCount(CHANNEL)).toBe(0);
	});

	test('should fail the leader and release the lease when the result cannot be published', async () => {
		testBus.bus.publish.mockRejectedValue(new Error('publish unavailable'));

		// Followers never re-elect, so nobody gets the result and the run has failed
		await expect(runExclusive('key', async () => 'result')).rejects.toThrow('publish unavailable');
		expect(testStore.state.has('leader')).toBe(false);
	});

	test('should unsubscribe the leader before running fn', async () => {
		const { leader, finish } = await startLeader();

		expect(testBus.subscriberCount(CHANNEL)).toBe(0);

		finish('result');
		await leader;

		expect(testBus.subscriberCount(CHANNEL)).toBe(0);
	});

	test('should unsubscribe a follower that times out waiting for the leader', async () => {
		const { leader, finish } = await startLeader();

		const follower = runExclusive('key', vi.fn(), { timeout: 1000 });
		await testStore.whenSettled(2);

		expect(testBus.subscriberCount(CHANNEL)).toBe(1);

		const timedOut = expect(follower).rejects.toThrow('Timeout of 1000ms exceeded');
		await vi.advanceTimersByTimeAsync(1000);
		await timedOut;

		expect(testBus.subscriberCount(CHANNEL)).toBe(0);

		finish('result');
		await expect(leader).resolves.toEqual({ result: 'result', leader: true });
	});

	test('should fail a leader that outran the timeout, and its followers with it', async () => {
		const running = withResolvers();
		const fn = withResolvers<string>();

		const leader = runExclusive(
			'key',
			() => {
				running.resolve();
				return fn.promise;
			},
			{ timeout: 1000 },
		);

		await running.promise;

		// Long enough for the leader to outrun its timeout, short enough for the follower to still wait
		const follower = runExclusive('key', vi.fn(), { timeout: 5000 });
		await testStore.whenSettled(2);

		await vi.advanceTimersByTimeAsync(1001);
		fn.resolve('result');

		await expect(leader).rejects.toMatchObject({
			message: 'Exclusive run for "key" failed',
			cause: 'Exclusive run for "key" exceeded 1000ms',
		});

		// Followers are handed the leader's overrun directly, not the leader's wrapper
		await expect(follower).rejects.toThrow('Exclusive run for "key" exceeded 1000ms');
	});

	test('should not retry fn once the timeout has passed', async () => {
		const fn = vi.fn(async () => {
			await new Promise((resolve) => setTimeout(resolve, 1001));
			throw new Error('failed');
		});

		const leader = runExclusive('key', fn, { timeout: 1000, maxAttempts: 3 });

		const timedOut = expect(leader).rejects.toThrow('Exclusive run for "key" failed');
		await vi.advanceTimersByTimeAsync(1001);
		await timedOut;

		expect(fn).toHaveBeenCalledTimes(1);
	});

	test('should publish the result even when releasing the lease fails', async () => {
		const { leader, finish } = await startLeader();

		const follower = runExclusive('key', vi.fn());
		await testStore.whenSettled(2);

		testStore.fail();
		finish('result');

		await expect(leader).resolves.toEqual({ result: 'result', leader: true });
		await expect(follower).resolves.toEqual({ result: 'result', leader: false });

		expect(logger.warn).toHaveBeenCalledWith(expect.any(Error), 'Could not release exclusive lease');
	});

	describe('heartbeat', () => {
		test('should renew the lease while fn is running', async () => {
			const { leader, finish } = await startLeader();

			expect(testStore.ops).toEqual(['get:leader', 'set:leader']);

			await vi.advanceTimersByTimeAsync(HEARTBEAT_INTERVAL);

			expect(testStore.ops).toEqual(['get:leader', 'set:leader', 'get:leader', 'set:leader']);

			finish('result');
			await expect(leader).resolves.toEqual({ result: 'result', leader: true });
		});

		test('should tell followers it is still alive while fn is running', async () => {
			const { leader, finish } = await startLeader();

			await vi.advanceTimersByTimeAsync(HEARTBEAT_INTERVAL);

			expect(testBus.bus.publish).toHaveBeenCalledWith(CHANNEL, { type: 'heartbeat' });

			finish('result');
			await expect(leader).resolves.toEqual({ result: 'result', leader: true });
		});

		test('should not renew a lease it no longer owns', async () => {
			const { leader, finish } = await startLeader();

			// Simulate the lease expiring and being taken over by another invocation
			testStore.state.set('leader', 'someone-else');

			await vi.advanceTimersByTimeAsync(HEARTBEAT_INTERVAL);

			expect(testStore.state.get('leader')).toBe('someone-else');

			finish('result');
			await expect(leader).resolves.toEqual({ result: 'result', leader: true });

			// The takeover must survive this invocation finishing
			expect(testStore.state.get('leader')).toBe('someone-else');
		});

		test('should stop announcing once the lease has been lost', async () => {
			const { leader, finish } = await startLeader();

			testStore.state.set('leader', 'someone-else');

			await vi.advanceTimersByTimeAsync(HEARTBEAT_INTERVAL);

			// Another invocation may already be running fn, so this one must not keep
			// followers waiting on it
			expect(testBus.bus.publish).not.toHaveBeenCalled();

			finish('result');
			await expect(leader).resolves.toEqual({ result: 'result', leader: true });
		});

		test('should keep announcing, and not reject, while the store is unreachable', async () => {
			const rejections: unknown[] = [];
			const onUnhandled = (error: unknown) => rejections.push(error);
			process.on('unhandledRejection', onUnhandled);

			try {
				const { leader, finish } = await startLeader();

				// A store that cannot be reached says nothing about who holds the lease
				testStore.fail();
				await vi.advanceTimersByTimeAsync(HEARTBEAT_INTERVAL);

				expect(testBus.bus.publish).toHaveBeenCalledWith(CHANNEL, { type: 'heartbeat' });
				expect(logger.warn).toHaveBeenCalledWith(expect.any(Error), 'Could not renew exclusive lease');

				finish('result');
				await expect(leader).resolves.toEqual({ result: 'result', leader: true });

				// Give any stray rejection a turn to surface
				await vi.advanceTimersByTimeAsync(0);
				expect(rejections).toEqual([]);
			} finally {
				process.off('unhandledRejection', onUnhandled);
			}
		});

		test('should log, not reject, when the heartbeat cannot be published', async () => {
			const { leader, finish } = await startLeader();

			testBus.bus.publish.mockRejectedValueOnce(new Error('bus unavailable'));
			await vi.advanceTimersByTimeAsync(HEARTBEAT_INTERVAL);

			expect(logger.warn).toHaveBeenCalledWith(expect.any(Error), 'Could not publish exclusive heartbeat');

			finish('result');
			await expect(leader).resolves.toEqual({ result: 'result', leader: true });
		});

		test('should stop beating once fn has settled', async () => {
			await runExclusive('key', async () => 'result');

			testStore.store.mockClear();
			testBus.bus.publish.mockClear();

			await vi.advanceTimersByTimeAsync(HEARTBEAT_INTERVAL * 3);

			expect(testStore.store).not.toHaveBeenCalled();
			expect(testBus.bus.publish).not.toHaveBeenCalled();
		});

		test('should keep a follower waiting for as long as the heartbeats keep arriving', async () => {
			const { leader, finish } = await startLeader();

			const follower = runExclusive('key', vi.fn(), { timeout: 300_000 });
			await testStore.whenSettled(2);

			// Well past the point a silent leader would have been given up on
			await vi.advanceTimersByTimeAsync(HEARTBEAT_TIMEOUT * 3);

			finish('result');

			await expect(leader).resolves.toEqual({ result: 'result', leader: true });
			await expect(follower).resolves.toEqual({ result: 'result', leader: false });
		});

		test('should reject a follower whose leader stops heartbeating', async () => {
			// A lease held by a leader that never heartbeats, as if its process went away
			testStore.state.set('leader', 'someone-else');

			const follower = runExclusive('key', vi.fn(), { timeout: 300_000 });
			await testStore.whenSettled(1);

			await vi.advanceTimersByTimeAsync(HEARTBEAT_TIMEOUT - 1);
			expect(testBus.subscriberCount(CHANNEL)).toBe(1);

			const abandoned = expect(follower).rejects.toThrow(`Stalled after ${HEARTBEAT_TIMEOUT}ms`);
			await vi.advanceTimersByTimeAsync(1);
			await abandoned;

			expect(testBus.subscriberCount(CHANNEL)).toBe(0);
		});

		test('should still time out a follower whose leader is alive but never finishes', async () => {
			const { leader, finish } = await startLeader();

			// Outlasts several heartbeats, so only the overall timeout can end the wait
			const follower = runExclusive('key', vi.fn(), { timeout: HEARTBEAT_INTERVAL * 6 });
			await testStore.whenSettled(2);

			const timedOut = expect(follower).rejects.toThrow(`Timeout of ${HEARTBEAT_INTERVAL * 6}ms exceeded`);
			await vi.advanceTimersByTimeAsync(HEARTBEAT_INTERVAL * 6);
			await timedOut;

			expect(testBus.subscriberCount(CHANNEL)).toBe(0);

			finish('result');
			await expect(leader).resolves.toEqual({ result: 'result', leader: true });
		});
	});
});
