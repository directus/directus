import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useBus } from '../bus/index.js';
import { useLogger } from '../logger/index.js';
import { withResolvers } from '../test-utils/async.js';
import { createMockBus } from '../test-utils/bus.js';
import { createMockStore } from '../test-utils/store.js';
import { runExclusive } from './run-exclusive.js';
import { useStore } from './store.js';

vi.mock('../bus/index.js');
vi.mock('../logger/index.js');
vi.mock('./store.js');

const CHANNEL = 'exclusive:key';

/** How long the lease survives without being renewed */
const LEASE_TTL = 10_000;

/** A quarter of the lease, leaving a whole renewal of room after two missed ones */
const RENEW_INTERVAL = 2500;

/** Past the lease, so a lease left behind by a leader that went away has expired by then */
const LEADER_CHECK = LEASE_TTL + RENEW_INTERVAL;

/** A long run, for a leader that is working rather than gone */
const TWO_MINUTES = 120_000;

describe('runExclusive', () => {
	let testBus: ReturnType<typeof createMockBus>;
	let testStore: ReturnType<typeof createMockStore>;
	let logger: { warn: ReturnType<typeof vi.fn> };

	beforeEach(() => {
		vi.useFakeTimers();

		testBus = createMockBus();
		testStore = createMockStore({ ttl: LEASE_TTL });
		logger = { warn: vi.fn() };

		vi.mocked(useBus).mockReturnValue(testBus.bus as any);
		vi.mocked(useStore).mockReturnValue(testStore.store as any);
		vi.mocked(useLogger).mockReturnValue(logger as any);
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.clearAllMocks();
	});

	/** Starts an invocation that leads, and holds it inside `fn` until the caller says otherwise */
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

	test('should take an fn that is not async', async () => {
		await expect(runExclusive('key', () => 'result')).resolves.toEqual({ result: 'result', leader: true });
	});

	test('should reject the leader with the error fn threw, and give the lease back', async () => {
		const error = new Error('boom');

		await expect(runExclusive('key', () => Promise.reject(error))).rejects.toBe(error);
		expect(testStore.state.has('leader')).toBe(false);
	});

	test('should reject the leader when fn throws before it returns a promise', async () => {
		const error = new Error('boom');

		await expect(
			runExclusive('key', () => {
				throw error;
			}),
		).rejects.toBe(error);

		expect(testStore.state.has('leader')).toBe(false);
	});

	test('should reject the followers with the reason the leader failed', async () => {
		const { leader, fail } = await startLeader();

		const fn = vi.fn();
		const follower = runExclusive('key', fn);

		await testStore.whenSettled(2);
		fail(new Error('boom'));

		await expect(leader).rejects.toThrow('boom');
		await expect(follower).rejects.toThrow('boom');

		expect(fn).not.toHaveBeenCalled();
	});

	test('should carry a thrown value that is not an error to the followers', async () => {
		const { leader, fail } = await startLeader();

		const follower = runExclusive('key', vi.fn());

		await testStore.whenSettled(2);
		fail('boom');

		await expect(leader).rejects.toBe('boom');
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

		await expect(runExclusive('key', fn, { maxAttempts: 2 })).rejects.toThrow('boom');
		expect(fn).toHaveBeenCalledTimes(2);
	});

	test('should release the lease so a later invocation can lead again', async () => {
		await runExclusive('key', async () => 'first');

		expect(testStore.state.has('leader')).toBe(false);

		const fn = vi.fn().mockResolvedValue('second');

		await expect(runExclusive('key', fn)).resolves.toEqual({ result: 'second', leader: true });
		expect(fn).toHaveBeenCalledTimes(1);
	});

	test('should lead, not wait, when arriving between the release and the publish', async () => {
		const fn = vi.fn().mockResolvedValue('result');
		const arrival = withResolvers<unknown>();

		testBus.setOnPublish(async () => {
			testBus.setOnPublish(undefined);
			arrival.resolve(runExclusive('key', fn));

			await testStore.whenSettled(3);
		});

		await expect(runExclusive('key', fn)).resolves.toEqual({ result: 'result', leader: true });
		await expect(arrival.promise).resolves.toEqual({ result: 'result', leader: true });
		expect(fn).toHaveBeenCalledTimes(2);
	});

	test('should follow, rather than fail, when the lease cannot be taken', async () => {
		const { leader, finish } = await startLeader();

		testStore.fail();

		const fn = vi.fn();
		const follower = runExclusive('key', fn);

		await testStore.whenSettled(2);
		finish('result');

		await expect(follower).resolves.toEqual({ result: 'result', leader: false });
		await expect(leader).resolves.toEqual({ result: 'result', leader: true });

		expect(fn).not.toHaveBeenCalled();

		expect(logger.warn).toHaveBeenCalledWith(expect.any(Error), 'Could not hold the exclusive lease for "key"');
	});

	test('should spend its whole budget when the lease cannot be read at all', async () => {
		testStore.fail();

		const fn = vi.fn();
		const follower = runExclusive('key', fn, { timeout: LEADER_CHECK * 2 });

		const timedOut = expect(follower).rejects.toThrow(`Exclusive run for "key" timed out after ${LEADER_CHECK * 2}ms`);

		await vi.advanceTimersByTimeAsync(LEADER_CHECK * 2);
		await timedOut;

		expect(fn).not.toHaveBeenCalled();

		expect(testBus.subscriberCount(CHANNEL)).toBe(0);
	});

	test('should stop listening once it is the one producing the result', async () => {
		const { leader, finish } = await startLeader();

		expect(testBus.subscriberCount(CHANNEL)).toBe(0);

		finish('result');
		await leader;

		expect(testBus.subscriberCount(CHANNEL)).toBe(0);
	});

	test('should log, not fail, when the bus listener cannot be released', async () => {
		testBus.bus.unsubscribe.mockRejectedValue(new Error('bus unavailable'));

		const { leader, finish } = await startLeader();

		const follower = runExclusive('key', vi.fn());

		await testStore.whenSettled(2);
		finish('result');

		await expect(follower).resolves.toEqual({ result: 'result', leader: false });
		await leader;

		expect(logger.warn).toHaveBeenCalledWith(expect.any(Error), `Could not release the bus listener for "${CHANNEL}"`);
	});

	test('should keep its result when it cannot be published', async () => {
		testBus.bus.publish.mockRejectedValue(new Error('publish unavailable'));

		await expect(runExclusive('key', async () => 'result')).resolves.toEqual({ result: 'result', leader: true });

		expect(logger.warn).toHaveBeenCalledWith(expect.any(Error), 'Could not publish the exclusive result for "key"');

		expect(testStore.state.has('leader')).toBe(false);
	});

	test('should publish the result even when releasing the lease fails', async () => {
		const { leader, finish } = await startLeader();

		const follower = runExclusive('key', vi.fn());
		await testStore.whenSettled(2);

		testStore.fail();
		finish('result');

		await expect(leader).resolves.toEqual({ result: 'result', leader: true });
		await expect(follower).resolves.toEqual({ result: 'result', leader: false });

		expect(logger.warn).toHaveBeenCalledWith(expect.any(Error), 'Could not release the exclusive lease for "key"');
	});

	describe('timeout', () => {
		test('should reject a follower that ran out of time waiting', async () => {
			const { leader, finish } = await startLeader();

			const follower = runExclusive('key', vi.fn(), { timeout: 1000 });
			await testStore.whenSettled(2);

			const timedOut = expect(follower).rejects.toThrow('Exclusive run for "key" timed out after 1000ms');
			await vi.advanceTimersByTimeAsync(1000);
			await timedOut;

			expect(testBus.subscriberCount(CHANNEL)).toBe(0);

			finish('result');
			await expect(leader).resolves.toEqual({ result: 'result', leader: true });
		});

		test('should fail a leader that outran the timeout, and its followers with it', async () => {
			const running = withResolvers<void>();
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

			const follower = runExclusive('key', vi.fn(), { timeout: 5000 });
			await testStore.whenSettled(2);

			const timedOut = expect(leader).rejects.toThrow('Exclusive run for "key" timed out after 1000ms');

			const handed = expect(follower).rejects.toThrow('Exclusive run for "key" timed out after 1000ms');

			await vi.advanceTimersByTimeAsync(1000);

			await timedOut;
			await handed;
		});

		test('should not retry fn once the timeout has passed', async () => {
			const fn = vi.fn(async () => {
				await new Promise((resolve) => setTimeout(resolve, 1001));
				throw new Error('failed');
			});

			const leader = runExclusive('key', fn, { timeout: 1000, maxAttempts: 3 });

			const timedOut = expect(leader).rejects.toThrow('Exclusive run for "key" timed out after 1000ms');
			await vi.advanceTimersByTimeAsync(1001);
			await timedOut;

			expect(fn).toHaveBeenCalledTimes(1);
		});

		test('should reject a caller whose time ran out before it could elect', async () => {
			const electing = withResolvers<boolean>();

			testStore.store.mockImplementationOnce(() => electing.promise as any);

			const fn = vi.fn();
			const run = runExclusive('key', fn, { timeout: 1000 });

			const timedOut = expect(run).rejects.toThrow('Exclusive run for "key" timed out after 1000ms');

			await vi.advanceTimersByTimeAsync(1000);

			electing.resolve(false);
			await timedOut;

			expect(fn).not.toHaveBeenCalled();
		});

		test('should give the lease back when its time ran out taking it', async () => {
			const electing = withResolvers<void>();
			const elect = testStore.store.getMockImplementation()!;

			testStore.store.mockImplementationOnce(async (callback: any) => {
				await electing.promise;
				return elect(callback);
			});

			const fn = vi.fn();
			const run = runExclusive('key', fn, { timeout: 1000 });

			const timedOut = expect(run).rejects.toThrow('Exclusive run for "key" timed out after 1000ms');

			await vi.advanceTimersByTimeAsync(1000);
			electing.resolve();
			await timedOut;

			expect(fn).not.toHaveBeenCalled();

			expect(testStore.state.has('leader')).toBe(false);
		});

		test('should reject rather than take over once the timeout has passed', async () => {
			testStore.state.set('leader', 'someone-else');

			const fn = vi.fn();
			const follower = runExclusive('key', fn, { timeout: 1000 });

			const timedOut = expect(follower).rejects.toThrow('Exclusive run for "key" timed out after 1000ms');
			await vi.advanceTimersByTimeAsync(1000);
			await timedOut;

			expect(fn).not.toHaveBeenCalled();
		});
	});

	describe('lease', () => {
		test('should renew the lease while fn is running', async () => {
			const { leader, finish } = await startLeader();

			expect(testStore.ops).toEqual(['get:leader', 'set:leader']);

			await vi.advanceTimersByTimeAsync(RENEW_INTERVAL);

			expect(testStore.ops).toEqual(['get:leader', 'set:leader', 'get:leader', 'set:leader']);

			finish('result');
			await expect(leader).resolves.toEqual({ result: 'result', leader: true });
		});

		test('should not renew a lease it no longer owns', async () => {
			const { leader, finish } = await startLeader();

			testStore.state.set('leader', 'someone-else');

			await vi.advanceTimersByTimeAsync(RENEW_INTERVAL);

			expect(testStore.state.get('leader')).toBe('someone-else');

			finish('result');
			await expect(leader).resolves.toEqual({ result: 'result', leader: true });

			expect(testStore.state.get('leader')).toBe('someone-else');

			expect(testBus.bus.publish).not.toHaveBeenCalled();
		});

		test('should keep renewing, and not reject, while the store is unreachable', async () => {
			const rejections: unknown[] = [];
			const onUnhandled = (error: unknown) => rejections.push(error);
			process.on('unhandledRejection', onUnhandled);

			try {
				const { leader, finish } = await startLeader();

				testStore.fail();
				await vi.advanceTimersByTimeAsync(RENEW_INTERVAL);

				expect(logger.warn).toHaveBeenCalledWith(expect.any(Error), 'Could not hold the exclusive lease for "key"');

				finish('result');
				await expect(leader).resolves.toEqual({ result: 'result', leader: true });

				expect(testBus.bus.publish).toHaveBeenCalledWith(CHANNEL, { ok: true, result: 'result' });

				await vi.advanceTimersByTimeAsync(0);
				expect(rejections).toEqual([]);
			} finally {
				process.off('unhandledRejection', onUnhandled);
			}
		});

		test('should not let releasing the lease overtake a renewal in flight', async () => {
			const { leader, finish } = await startLeader();

			const renewing = withResolvers<void>();
			const store = testStore.store.getMockImplementation()!;

			testStore.store.mockImplementationOnce(async (callback: any) => {
				await renewing.promise;
				return store(callback);
			});

			await vi.advanceTimersByTimeAsync(RENEW_INTERVAL);

			finish('result');
			await vi.advanceTimersByTimeAsync(0);

			expect(testStore.state.has('leader')).toBe(true);

			renewing.resolve();

			await expect(leader).resolves.toEqual({ result: 'result', leader: true });
			expect(testStore.state.has('leader')).toBe(false);
		});

		test('should stop renewing once fn has settled', async () => {
			await runExclusive('key', async () => 'result');

			testStore.store.mockClear();

			await vi.advanceTimersByTimeAsync(RENEW_INTERVAL * 3);

			expect(testStore.store).not.toHaveBeenCalled();
		});

		test('should see a run that takes minutes through on the default budget', async () => {
			const { leader, finish } = await startLeader();

			const fn = vi.fn();
			const follower = runExclusive('key', fn);
			await testStore.whenSettled(2);

			await vi.advanceTimersByTimeAsync(TWO_MINUTES);

			expect(testStore.ops.filter((op) => op === 'set:leader')).toHaveLength(
				1 + Math.floor(TWO_MINUTES / RENEW_INTERVAL),
			);

			expect(testStore.state.get('leader')).toEqual(expect.any(String));
			expect(fn).not.toHaveBeenCalled();

			finish('result');

			await expect(leader).resolves.toEqual({ result: 'result', leader: true });
			await expect(follower).resolves.toEqual({ result: 'result', leader: false });
		});
	});

	describe('takeover', () => {
		test('should take over from a leader that stopped renewing its lease', async () => {
			testStore.state.set('leader', 'someone-else');

			const fn = vi.fn().mockResolvedValue('result');
			const follower = runExclusive('key', fn);

			await testStore.whenSettled(1);

			await vi.advanceTimersByTimeAsync(LEADER_CHECK);

			await expect(follower).resolves.toEqual({ result: 'result', leader: true });
			expect(fn).toHaveBeenCalledTimes(1);
			expect(logger.warn).toHaveBeenCalledWith('Exclusive run for "key" lost its leader, taking over');
		});

		test('should lead for the followers that did not take over', async () => {
			testStore.state.set('leader', 'someone-else');

			const running = withResolvers<void>();
			const finish = withResolvers<string>();

			const fn = vi.fn(() => {
				running.resolve();
				return finish.promise;
			});

			const other = vi.fn();

			const first = runExclusive('key', fn);
			const second = runExclusive('key', other);

			await testStore.whenSettled(2);

			await vi.advanceTimersByTimeAsync(LEADER_CHECK);
			await running.promise;

			finish.resolve('result');

			await expect(first).resolves.toEqual({ result: 'result', leader: true });
			await expect(second).resolves.toEqual({ result: 'result', leader: false });

			expect(fn).toHaveBeenCalledTimes(1);
			expect(other).not.toHaveBeenCalled();
		});
	});
});
