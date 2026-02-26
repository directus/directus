import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { _bufferedCounterCache, useBufferedCounter } from './use-buffered-counter.js';
import { useCounters } from './use-counters.js';

vi.mock('./use-counters.js');

const mockCounter = {
	increment: vi.fn().mockResolvedValue(0),
	get: vi.fn().mockResolvedValue(undefined),
};

beforeEach(() => {
	vi.useFakeTimers();
	vi.mocked(useCounters).mockReturnValue(mockCounter as any);
});

afterEach(async () => {
	vi.useRealTimers();
	vi.clearAllMocks();

	for (const key of Object.keys(_bufferedCounterCache)) {
		if (_bufferedCounterCache[key]?.timer) {
			clearInterval(_bufferedCounterCache[key]!.timer!);
		}

		_bufferedCounterCache[key] = null;
	}
});

describe('useBufferedCounter', () => {

	describe('instantiation', () => {
		test('Creates a flusher bound to a counter namespace', () => {
			const flusher = useBufferedCounter('requests');

			expect(useCounters).toHaveBeenCalled();
			expect(flusher).toHaveProperty('increment');
			expect(flusher).toHaveProperty('flush');
			expect(flusher).toHaveProperty('flushAll');
			expect(flusher).toHaveProperty('destroy');
		});

		test('Returns the same flusher entry for the same key', () => {
			useBufferedCounter('requests');
			const entry1 = _bufferedCounterCache['requests'];

			useBufferedCounter('requests');
			const entry2 = _bufferedCounterCache['requests'];

			expect(entry1).toBe(entry2);
		});

		test('Creates separate flusher entries for different keys', () => {
			useBufferedCounter('requests');
			useBufferedCounter('webhooks');

			expect(_bufferedCounterCache['requests']).not.toBe(_bufferedCounterCache['webhooks']);
		});

		test('Uses default options when none provided', () => {
			useBufferedCounter('requests');

			expect(_bufferedCounterCache['requests']!.options).toEqual({
				maxBucketSize: 100,
				flushIntervalMs: 5000,
			});
		});

		test('Merges custom options with defaults', () => {
			useBufferedCounter('requests', { maxBucketSize: 50 });

			expect(_bufferedCounterCache['requests']!.options).toEqual({
				maxBucketSize: 50,
				flushIntervalMs: 5000,
			});
		});
	});

	describe('increment', () => {
		test('Accumulates count in local buffer without flushing', () => {
			const flusher = useBufferedCounter('requests');

			flusher.increment('get');
			flusher.increment('get');
			flusher.increment('get');

			expect(mockCounter.increment).not.toHaveBeenCalled();
		});

		test('Defaults to incrementing by 1', () => {
			const flusher = useBufferedCounter('requests');

			flusher.increment('get');

			expect(_bufferedCounterCache['requests']!.counters['get']!.count).toBe(1);
		});

		test('Increments by custom amount', () => {
			const flusher = useBufferedCounter('requests');

			flusher.increment('get', 5);

			expect(_bufferedCounterCache['requests']!.counters['get']!.count).toBe(5);
		});

		test('Tracks sub-keys independently', () => {
			const flusher = useBufferedCounter('requests');

			flusher.increment('get', 3);
			flusher.increment('post', 7);

			expect(_bufferedCounterCache['requests']!.counters['get']!.count).toBe(3);
			expect(_bufferedCounterCache['requests']!.counters['post']!.count).toBe(7);
		});

		test('Triggers flush when maxBucketSize is reached', async () => {
			const flusher = useBufferedCounter('requests', { maxBucketSize: 5 });

			flusher.increment('get', 5);

			await vi.advanceTimersByTimeAsync(0);

			expect(mockCounter.increment).toHaveBeenCalledWith('requests:get', 5);
		});

		test('Triggers flush when maxBucketSize is exceeded', async () => {
			const flusher = useBufferedCounter('requests', { maxBucketSize: 5 });

			flusher.increment('get', 8);

			await vi.advanceTimersByTimeAsync(0);

			expect(mockCounter.increment).toHaveBeenCalledWith('requests:get', 8);
		});

		test('Does not flush other sub-keys when one reaches threshold', async () => {
			const flusher = useBufferedCounter('requests', { maxBucketSize: 10 });

			flusher.increment('get', 3);
			flusher.increment('post', 10);

			await vi.advanceTimersByTimeAsync(0);

			expect(mockCounter.increment).toHaveBeenCalledTimes(1);
			expect(mockCounter.increment).toHaveBeenCalledWith('requests:post', 10);
		});
	});

	describe('flush', () => {
		test('Flushes a specific sub-key to the counter', async () => {
			const flusher = useBufferedCounter('requests');

			flusher.increment('get', 42);

			await flusher.flush('get');

			expect(mockCounter.increment).toHaveBeenCalledWith('requests:get', 42);
		});

		test('Resets count to 0 after successful flush', async () => {
			const flusher = useBufferedCounter('requests');

			flusher.increment('get', 10);
			await flusher.flush('get');

			expect(_bufferedCounterCache['requests']!.counters['get']!.count).toBe(0);
		});

		test('Does not call counter.increment when count is 0', async () => {
			const flusher = useBufferedCounter('requests');

			flusher.increment('get', 0);
			await flusher.flush('get');

			expect(mockCounter.increment).not.toHaveBeenCalled();
		});

		test('Does not call counter.increment for non-existent sub-key', async () => {
			const flusher = useBufferedCounter('requests');

			await flusher.flush('nonexistent');

			expect(mockCounter.increment).not.toHaveBeenCalled();
		});

		test('Re-adds count on flush failure', async () => {
			mockCounter.increment.mockRejectedValueOnce(new Error('Redis connection lost'));

			const flusher = useBufferedCounter('requests');

			flusher.increment('get', 25);

			await expect(flusher.flush('get')).rejects.toThrow('Redis connection lost');

			expect(_bufferedCounterCache['requests']!.counters['get']!.count).toBe(25);
		});

		test('Preserves counts accumulated during a failed flush', async () => {
			mockCounter.increment.mockRejectedValueOnce(new Error('Redis connection lost'));

			const flusher = useBufferedCounter('requests');

			flusher.increment('get', 10);

			const flushPromise = flusher.flush('get');

			flusher.increment('get', 5);

			await expect(flushPromise).rejects.toThrow('Redis connection lost');

			expect(_bufferedCounterCache['requests']!.counters['get']!.count).toBe(15);
		});

		test('Does not flush negative counts', async () => {
			const flusher = useBufferedCounter('requests');

			flusher.increment('get', -5);

			await flusher.flush('get');

			expect(mockCounter.increment).not.toHaveBeenCalled();
		});

		test('Guards against concurrent flushes on the same sub-key', async () => {
			let resolveFirst!: () => void;

			mockCounter.increment.mockImplementationOnce(
				() => new Promise<number>((resolve) => {
					resolveFirst = () => resolve(0);
				}),
			);

			const flusher = useBufferedCounter('requests');

			flusher.increment('get', 10);

			const firstFlush = flusher.flush('get');

			flusher.increment('get', 5);
			await flusher.flush('get');

			expect(mockCounter.increment).toHaveBeenCalledTimes(1);

			resolveFirst();
			await firstFlush;

			expect(_bufferedCounterCache['requests']!.counters['get']!.count).toBe(5);
		});
	});

	describe('flushAll', () => {
		test('Flushes all sub-keys', async () => {
			const flusher = useBufferedCounter('requests');

			flusher.increment('get', 10);
			flusher.increment('post', 20);
			flusher.increment('delete', 5);

			await flusher.flushAll();

			expect(mockCounter.increment).toHaveBeenCalledWith('requests:get', 10);
			expect(mockCounter.increment).toHaveBeenCalledWith('requests:post', 20);
			expect(mockCounter.increment).toHaveBeenCalledWith('requests:delete', 5);
			expect(mockCounter.increment).toHaveBeenCalledTimes(3);
		});

		test('Skips sub-keys with zero count', async () => {
			const flusher = useBufferedCounter('requests');

			flusher.increment('get', 10);
			flusher.increment('post', 0);

			await flusher.flushAll();

			expect(mockCounter.increment).toHaveBeenCalledTimes(1);
			expect(mockCounter.increment).toHaveBeenCalledWith('requests:get', 10);
		});

		test('Does nothing when no sub-keys exist', async () => {
			const flusher = useBufferedCounter('requests');

			await flusher.flushAll();

			expect(mockCounter.increment).not.toHaveBeenCalled();
		});
	});

	describe('timer-based flushing', () => {
		test('Flushes non-zero sub-keys when interval elapses', async () => {
			const flusher = useBufferedCounter('requests', { flushIntervalMs: 1000 });

			flusher.increment('get', 10);
			flusher.increment('post', 5);

			await vi.advanceTimersByTimeAsync(1000);

			expect(mockCounter.increment).toHaveBeenCalledWith('requests:get', 10);
			expect(mockCounter.increment).toHaveBeenCalledWith('requests:post', 5);
		});

		test('Does not flush sub-keys with zero count on interval', async () => {
			const flusher = useBufferedCounter('requests', { flushIntervalMs: 1000 });

			flusher.increment('get', 10);
			await flusher.flush('get');

			mockCounter.increment.mockClear();

			await vi.advanceTimersByTimeAsync(1000);

			expect(mockCounter.increment).not.toHaveBeenCalled();
		});

		test('Flushes repeatedly on each interval', async () => {
			const flusher = useBufferedCounter('requests', { flushIntervalMs: 1000 });

			flusher.increment('get', 3);
			await vi.advanceTimersByTimeAsync(1000);

			flusher.increment('get', 7);
			await vi.advanceTimersByTimeAsync(1000);

			expect(mockCounter.increment).toHaveBeenCalledTimes(2);
			expect(mockCounter.increment).toHaveBeenNthCalledWith(1, 'requests:get', 3);
			expect(mockCounter.increment).toHaveBeenNthCalledWith(2, 'requests:get', 7);
		});

		test('Timer skips flushing if a flush is already in flight', async () => {
			let resolveFlush!: () => void;

			mockCounter.increment.mockImplementationOnce(
				() => new Promise<number>((resolve) => {
					resolveFlush = () => resolve(0);
				}),
			);

			const flusher = useBufferedCounter('requests', { flushIntervalMs: 1000 });
			flusher.increment('get', 10);

			const flushPromise = flusher.flush('get');

			flusher.increment('get', 5);
			await vi.advanceTimersByTimeAsync(1000);

			expect(mockCounter.increment).toHaveBeenCalledTimes(1);

			resolveFlush();
			await flushPromise;

			expect(_bufferedCounterCache['requests']!.counters['get']!.count).toBe(5);
		});
	});

	describe('destroy', () => {
		test('Clears the interval timer', async () => {
			const flusher = useBufferedCounter('requests');

			expect(_bufferedCounterCache['requests']!.timer).not.toBeNull();

			await flusher.destroy();

			expect(_bufferedCounterCache['requests']).toBeNull();
		});

		test('Flushes all remaining counts before destroying', async () => {
			const flusher = useBufferedCounter('requests');

			flusher.increment('get', 10);
			flusher.increment('post', 20);

			await flusher.destroy();

			expect(mockCounter.increment).toHaveBeenCalledWith('requests:get', 10);
			expect(mockCounter.increment).toHaveBeenCalledWith('requests:post', 20);
		});

		test('Clears all counter state', async () => {
			const flusher = useBufferedCounter('requests');

			flusher.increment('get', 10);

			await flusher.destroy();

			expect(_bufferedCounterCache['requests']).toBeNull();
		});

		test('No more timer flushes occur after destroy', async () => {
			const flusher = useBufferedCounter('requests', { flushIntervalMs: 1000 });

			flusher.increment('get', 5);

			await flusher.destroy();

			mockCounter.increment.mockClear();

			await vi.advanceTimersByTimeAsync(5000);

			expect(mockCounter.increment).not.toHaveBeenCalled();
		});

		test('Ensures cleanup happens even if flushAll throws during destroy', async () => {
			mockCounter.increment.mockRejectedValueOnce(new Error('Network error'));

			const flusher = useBufferedCounter('requests');
			flusher.increment('get', 10);

			await flusher.destroy();

			expect(_bufferedCounterCache['requests']).toBeNull();
		});

		test('Allows re-creation of flusher after destroy', async () => {
			const flusher1 = useBufferedCounter('requests');
			await flusher1.destroy();

			const flusher2 = useBufferedCounter('requests');
			flusher2.increment('get', 1);

			expect(_bufferedCounterCache['requests']).not.toBeNull();
			expect(_bufferedCounterCache['requests']!.counters['get']!.count).toBe(1);

			await flusher2.destroy();
		});
	});

	describe('getAndResetAll', () => {
		test('Flushes buffered counts before reading', async () => {
			const flusher = useBufferedCounter('requests');

			flusher.increment('get', 10);
			flusher.increment('post', 5);

			mockCounter.get.mockImplementation(async (key: string) => {
				if (key === 'requests:get') return 10;
				if (key === 'requests:post') return 5;
				return undefined;
			});

			await flusher.getAndResetAll();

			// flushAll should have been called, pushing buffered counts
			expect(mockCounter.increment).toHaveBeenCalledWith('requests:get', 10);
			expect(mockCounter.increment).toHaveBeenCalledWith('requests:post', 5);
		});

		test('Returns all sub-key counts', async () => {
			const flusher = useBufferedCounter('requests');

			flusher.increment('get', 10);
			flusher.increment('post', 5);
			flusher.increment('delete', 3);

			mockCounter.get.mockImplementation(async (key: string) => {
				if (key === 'requests:get') return 10;
				if (key === 'requests:post') return 5;
				if (key === 'requests:delete') return 3;
				return undefined;
			});

			const result = await flusher.getAndResetAll();

			expect(result).toEqual({
				get: 10,
				post: 5,
				delete: 3,
			});
		});

		test('Defaults to 0 for sub-keys with no stored value', async () => {
			const flusher = useBufferedCounter('requests');

			flusher.increment('get', 5);

			mockCounter.get.mockResolvedValue(undefined);

			const result = await flusher.getAndResetAll();

			expect(result).toEqual({ get: 0 });
		});

		test('Resets all sub-key counts in the counter after reading', async () => {
			const flusher = useBufferedCounter('requests');

			flusher.increment('get', 10);
			flusher.increment('post', 5);

			mockCounter.get.mockImplementation(async (key: string) => {
				if (key === 'requests:get') return 10;
				if (key === 'requests:post') return 5;
				return undefined;
			});

			mockCounter.increment.mockClear();

			await flusher.getAndResetAll();

			// After the flush increments, it should decrement to reset
			expect(mockCounter.increment).toHaveBeenCalledWith('requests:get', -10);
			expect(mockCounter.increment).toHaveBeenCalledWith('requests:post', -5);
		});

		test('Does not reset sub-keys that are already 0', async () => {
			const flusher = useBufferedCounter('requests');

			flusher.increment('get', 0);

			mockCounter.get.mockResolvedValue(0);
			mockCounter.increment.mockClear();

			await flusher.getAndResetAll();

			expect(mockCounter.increment).not.toHaveBeenCalled();
		});

		test('Returns empty record when no sub-keys are tracked', async () => {
			const flusher = useBufferedCounter('requests');

			const result = await flusher.getAndResetAll();

			expect(result).toEqual({});
		});

		test('Includes expectedKeys not seen locally', async () => {
			const flusher = useBufferedCounter('requests');

			flusher.increment('get', 10);

			mockCounter.get.mockImplementation(async (key: string) => {
				if (key === 'requests:get') return 10;
				if (key === 'requests:post') return 7;
				if (key === 'requests:delete') return 3;
				return undefined;
			});

			const result = await flusher.getAndResetAll(['get', 'post', 'delete']);

			expect(result).toEqual({
				get: 10,
				post: 7,
				delete: 3,
			});
		});

		test('Resets expectedKeys not seen locally', async () => {
			const flusher = useBufferedCounter('requests');

			mockCounter.get.mockImplementation(async (key: string) => {
				if (key === 'requests:post') return 5;
				return undefined;
			});

			mockCounter.increment.mockClear();

			await flusher.getAndResetAll(['post']);

			expect(mockCounter.increment).toHaveBeenCalledWith('requests:post', -5);
		});

		test('Deduplicates local and expected keys', async () => {
			const flusher = useBufferedCounter('requests');

			flusher.increment('get', 10);

			mockCounter.get.mockImplementation(async (key: string) => {
				if (key === 'requests:get') return 10;
				if (key === 'requests:post') return 5;
				return undefined;
			});

			const result = await flusher.getAndResetAll(['get', 'post']);

			expect(result).toEqual({
				get: 10,
				post: 5,
			});

			expect(mockCounter.get).toHaveBeenCalledTimes(2);
		});

		test('Defaults to 0 for expectedKeys with no stored value', async () => {
			const flusher = useBufferedCounter('requests');

			mockCounter.get.mockResolvedValue(undefined);

			const result = await flusher.getAndResetAll(['get', 'post', 'cached']);

			expect(result).toEqual({
				get: 0,
				post: 0,
				cached: 0,
			});
		});
	});
})
