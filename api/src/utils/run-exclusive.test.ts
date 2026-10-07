import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useBus } from '../bus/index.js';
import { useLock } from '../lock/index.js';
import { useLogger } from '../logger/index.js';
import { withResolvers } from '../test-utils/async.js';
import { createMockBus } from '../test-utils/bus.js';
import { createMockLock } from '../test-utils/lock.js';
import { createMockLogger } from '../test-utils/logger.js';
import { inflight, runExclusive } from './run-exclusive.js';

vi.mock('../bus/index.js');
vi.mock('../lock/index.js');
vi.mock('../logger/index.js');

const CHANNEL = 'exclusive:key';

let testBus: ReturnType<typeof createMockBus>;
let testLock: ReturnType<typeof createMockLock>;
let logger: ReturnType<typeof createMockLogger>;

beforeEach(() => {
	vi.useFakeTimers();

	testBus = createMockBus();
	testLock = createMockLock();
	logger = createMockLogger();

	vi.mocked(useBus).mockReturnValue(testBus.bus as any);
	vi.mocked(useLock).mockReturnValue(testLock.lock as any);
	vi.mocked(useLogger).mockReturnValue(logger as any);
});

afterEach(() => {
	vi.useRealTimers();
	vi.clearAllMocks();
	inflight.clear();
});

async function startLeader(options?: Parameters<typeof runExclusive>[2]) {
	const running = withResolvers();
	const fn = withResolvers<string>();

	const leader = runExclusive(
		'key',
		() => {
			running.resolve();
			return fn.promise;
		},
		options,
	);

	await running.promise;

	return { leader, finish: fn.resolve, fail: fn.reject };
}

async function startFollower(options?: Parameters<typeof runExclusive>[2]) {
	testLock.hold('key');

	const fn = vi.fn().mockResolvedValue('own');
	const follower = runExclusive('key', fn, options);

	await vi.waitFor(() => expect(testLock.lock.usingLock).toHaveBeenCalled());

	return { follower, fn };
}

function failRelease() {
	testLock.lock.usingLock.mockImplementationOnce(async (_key, callback) => {
		await callback(new AbortController().signal);
		throw new Error('release failed');
	});
}

describe('leader', () => {
	test('should run fn and report itself as the leader on win', async () => {
		const fn = vi.fn().mockResolvedValue('result');

		await expect(runExclusive('key', fn)).resolves.toEqual({ result: 'result', leader: true });
		expect(fn).toHaveBeenCalledTimes(1);
		expect(testLock.isHeld('key')).toBe(false);
	});

	test('should reject the leader when fn throws before it returns a promise', async () => {
		const throwing = () => {
			throw new Error('failed');
		};

		await expect(runExclusive('key', throwing)).rejects.toThrow('failed');
	});

	test('should publish the outcome for followers on other instances', async () => {
		await runExclusive('key', () => 'result');

		expect(testBus.bus.publish).toHaveBeenCalledWith(CHANNEL, { ok: true, result: 'result' });
	});

	test.each([
		{ thrown: new Error('failed'), published: 'failed' },
		{ thrown: 'not an error', published: 'not an error' },
	])(
		'should publish a failure as its message, rejecting the leader with what fn threw',
		async ({ thrown, published }) => {
			await expect(runExclusive('key', () => Promise.reject(thrown))).rejects.toBe(thrown);

			expect(testBus.bus.publish).toHaveBeenCalledWith(CHANNEL, { ok: false, error: published });
		},
	);

	test('should keep, but not publish, a result finished after losing the lock', async () => {
		const { leader, finish } = await startLeader();

		testLock.abandon('key');
		finish('result');

		await expect(leader).resolves.toEqual({ result: 'result', leader: true });
		expect(testBus.bus.publish).not.toHaveBeenCalled();
		expect(logger.warn).toHaveBeenCalledOnce();
	});
});

describe('callers in this process', () => {
	test('should run fn once for concurrent callers in this process and share the result', async () => {
		const { promise, resolve } = withResolvers<string>();
		const fn = vi.fn(() => promise);

		const leader = runExclusive('key', fn);
		const joined = runExclusive('key', fn);

		resolve('result');

		await expect(leader).resolves.toEqual({ result: 'result', leader: true });
		await expect(joined).resolves.toEqual({ result: 'result', leader: false });
		expect(fn).toHaveBeenCalledTimes(1);
		expect(testLock.lock.usingLock).toHaveBeenCalledTimes(1);
	});

	test('should reject the leader and the callers joined to it with the error fn threw', async () => {
		const { leader, fail } = await startLeader();
		const joined = runExclusive('key', vi.fn());

		fail(new Error('failed'));

		await expect(leader).rejects.toThrow('failed');
		await expect(joined).rejects.toThrow('failed');
		expect(testLock.isHeld('key')).toBe(false);
		expect(testLock.lock.usingLock).toHaveBeenCalledTimes(1);
	});

	test.each([
		{ previous: 'finished', fn: () => 'first' },
		{ previous: 'failed', fn: () => Promise.reject(new Error('first')) },
	])('should start a new run once the previous one has $previous', async ({ fn }) => {
		await runExclusive('key', fn).catch(() => {});

		await expect(runExclusive('key', () => 'second')).resolves.toEqual({ result: 'second', leader: true });
	});

	test('should run different keys independently', async () => {
		const { leader, finish } = await startLeader();
		await expect(runExclusive('other', () => 'other')).resolves.toEqual({ result: 'other', leader: true });

		finish('result');

		await expect(leader).resolves.toEqual({ result: 'result', leader: true });
	});
});

describe('followers', () => {
	test('should resolve a follower with the outcome another instance published', async () => {
		const { follower, fn } = await startFollower();

		await testBus.bus.publish(CHANNEL, { ok: true, result: 'result' });

		await expect(follower).resolves.toEqual({ result: 'result', leader: false });
		expect(fn).not.toHaveBeenCalled();
		expect(testLock.lock.usingLock).toHaveBeenCalledTimes(1);
	});

	test('should reject a follower with the failure another instance published', async () => {
		const { follower } = await startFollower();

		await testBus.bus.publish(CHANNEL, { ok: false, error: 'failed' });

		await expect(follower).rejects.toThrow('failed');
	});

	test('should keep waiting while the leader still holds the lock', async () => {
		const { follower, fn } = await startFollower({ lease: 1000 });

		await vi.advanceTimersByTimeAsync(5000);
		expect(fn).not.toHaveBeenCalled();

		await testBus.bus.publish(CHANNEL, { ok: true, result: 'result' });
		await expect(follower).resolves.toEqual({ result: 'result', leader: false });
	});

	test('should take over from a leader that went away once its lease runs out', async () => {
		const { follower, fn } = await startFollower({ lease: 1000 });

		testLock.abandon('key');
		await vi.advanceTimersByTimeAsync(1000);

		await expect(follower).resolves.toEqual({ result: 'own', leader: true });
		expect(fn).toHaveBeenCalledTimes(1);
		expect(logger.warn).toHaveBeenCalledOnce();
	});

	test('should follow, not run fn, when an outcome lands while it takes the lock', async () => {
		const fn = vi.fn();

		testLock.lock.usingLock.mockImplementationOnce(async (_key, callback) => {
			await testBus.bus.publish(CHANNEL, { ok: true, result: 'result' });
			return callback(new AbortController().signal);
		});

		await expect(runExclusive('key', fn)).resolves.toEqual({ result: 'result', leader: false });
		expect(fn).not.toHaveBeenCalled();
	});

	test('should leave no listener or timer behind once the run settles', async () => {
		const { follower } = await startFollower();

		await testBus.bus.publish(CHANNEL, { ok: true, result: 'result' });
		await follower;

		expect(testBus.subscriberCount(CHANNEL)).toBe(0);
		expect(vi.getTimerCount()).toBe(0);
	});
});

describe('timeouts', () => {
	test('should reject a follower that ran out of time, then stop retrying for leader and listening', async () => {
		const { follower } = await startFollower({ timeout: 3000 });
		const settled = expect(follower).rejects.toThrow('timed out after 3000ms');

		await vi.advanceTimersByTimeAsync(3000);
		await settled;

		expect(testBus.subscriberCount(CHANNEL)).toBe(0);

		const attempts = testLock.lock.usingLock.mock.calls.length;

		await vi.advanceTimersByTimeAsync(60_000);

		expect(testLock.lock.usingLock).toHaveBeenCalledTimes(attempts);
		expect(vi.getTimerCount()).toBe(0);
	});

	test('should fail a leader and its followers that outran the timeout and release lock', async () => {
		const { leader } = await startLeader({ timeout: 3000 });
		const led = expect(leader).rejects.toThrow('timed out after 3000ms');

		const joined = expect(runExclusive('key', vi.fn(), { timeout: 60_000 })).rejects.toThrow('timed out after 3000ms');

		await vi.advanceTimersByTimeAsync(3000);
		await led;
		await joined;

		expect(testLock.isHeld('key')).toBe(false);
		expect(testLock.lock.usingLock).toHaveBeenCalledTimes(1);
	});

	test('should time out, rather than run fn, when the lock cannot be taken', async () => {
		testLock.fail();

		const fn = vi.fn();
		const settled = expect(runExclusive('key', fn, { timeout: 3000 })).rejects.toThrow('timed out after 3000ms');

		await vi.advanceTimersByTimeAsync(3000);
		await settled;

		expect(fn).not.toHaveBeenCalled();
	});

	test('should reject by its timeout, and not run fn, when the bus never answers', async () => {
		testBus.bus.subscribe.mockReturnValueOnce(new Promise(() => {}));

		const fn = vi.fn();
		const settled = expect(runExclusive('key', fn, { timeout: 1000 })).rejects.toThrow('timed out after 1000ms');

		await vi.advanceTimersByTimeAsync(1000);
		await settled;

		expect(fn).not.toHaveBeenCalled();
	});

	test('should reject by its timeout, and not run fn, when the lock is only granted after it', async () => {
		const granted = withResolvers();

		testLock.lock.usingLock.mockImplementationOnce(async (_key, callback) => {
			await granted.promise;
			return callback(new AbortController().signal);
		});

		const fn = vi.fn();
		const settled = expect(runExclusive('key', fn, { timeout: 1000 })).rejects.toThrow('timed out after 1000ms');

		await vi.advanceTimersByTimeAsync(1000);
		await settled;

		granted.resolve();
		await vi.advanceTimersByTimeAsync(0);

		expect(fn).not.toHaveBeenCalled();
		expect(testBus.bus.publish).not.toHaveBeenCalled();
	});
});

describe('bus and lock failures', () => {
	test('should reject, and not run fn, when it cannot listen for the outcome', async () => {
		testBus.bus.subscribe.mockRejectedValueOnce(new Error('bus unavailable'));

		const fn = vi.fn();

		await expect(runExclusive('key', fn)).rejects.toThrow('bus unavailable');
		expect(fn).not.toHaveBeenCalled();
	});

	test('should keep its result when it cannot be published', async () => {
		testBus.bus.publish.mockRejectedValueOnce(new Error('bus unavailable'));

		await expect(runExclusive('key', () => 'result')).resolves.toEqual({ result: 'result', leader: true });
		expect(logger.warn).toHaveBeenCalled();
	});

	test('should log, not fail, when the bus listener cannot be released', async () => {
		testBus.bus.unsubscribe.mockRejectedValueOnce(new Error('bus unavailable'));

		await expect(runExclusive('key', () => 'result')).resolves.toEqual({ result: 'result', leader: true });
		expect(logger.warn).toHaveBeenCalled();
	});

	test('should keep its result when the lock cannot be released', async () => {
		failRelease();

		await expect(runExclusive('key', () => 'result')).resolves.toEqual({ result: 'result', leader: true });
	});

	test('should keep its error when the lock cannot be released', async () => {
		failRelease();

		await expect(runExclusive('key', () => Promise.reject(new Error('failed')))).rejects.toThrow('failed');
	});
});
