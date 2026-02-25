import { useCounter } from './use-counter.js';

interface FlusherOptions {
	/** Maximum count to accumulate before forcing a flush. Default: 100 */
	maxBucketSize?: number;
	/** Maximum time in ms between flushes. Default: 5000 */
	flushIntervalMs?: number;
}

interface CounterState {
	count: number;
	flushing: boolean;
}

const DEFAULT_OPTIONS: Required<FlusherOptions> = {
	maxBucketSize: 100,
	flushIntervalMs: 5000,
};

interface FlusherEntry {
	counters: Record<string, CounterState>;
	options: Required<FlusherOptions>;
	timer: ReturnType<typeof setInterval> | null;
}

export const _bufferedCounterCache: Record<string, FlusherEntry | null> = {};

/**
 * Returns a buffered counter bound to a counter namespace (e.g. "requests").
 * Internally manages independent buckets per sub-key (e.g. "GET", "POST").
 *
 * @param key - The counter namespace passed to `useCounter`.
 * @param options - Optional bucket size and interval configuration.
 */
export const useBufferedCounter = (key: string, options?: FlusherOptions) => {
	if (!_bufferedCounterCache[key]) {
		const opts = { ...DEFAULT_OPTIONS, ...options };

		const flusherEntry: FlusherEntry = {
			counters: {},
			options: opts,
			timer: null as ReturnType<typeof setInterval> | null,
		};

		// Single timer for all sub-keys under this namespace
		flusherEntry.timer = setInterval(() => {
			for (const [subKey, state] of Object.entries(flusherEntry.counters)) {
				if (state.count > 0 && !state.flushing) {
					void flush(subKey);
				}
			}
		}, opts.flushIntervalMs);

		if (flusherEntry.timer && typeof flusherEntry.timer === 'object' && 'unref' in flusherEntry.timer) {
			flusherEntry.timer.unref();
		}

		_bufferedCounterCache[key] = flusherEntry;
	}

	const flusher = _bufferedCounterCache[key];
	const counter = useCounter(key);

	const getOrCreateState = (subKey: string): CounterState => {
		let state = flusher.counters[subKey];

		if (!state) {
			state = { count: 0, flushing: false };
			flusher.counters[subKey] = state;
		}

		return state;
	};

	const flush = async (subKey: string): Promise<void> => {
		const state = flusher.counters[subKey];

		if (!state || state.count <= 0 || state.flushing) return;

		state.flushing = true;
		const amount = state.count;
		state.count = 0;

		try {
			await counter.increment(subKey, amount);
		} catch (err) {
			state.count += amount;
			throw err;
		} finally {
			state.flushing = false;
		}
	};

	const flushAll = async (): Promise<void> => {
		await Promise.all(
			Object.keys(flusher.counters).map((subKey) => flush(subKey)),
		);
	};

	const destroy = async (): Promise<void> => {
		if (flusher.timer) {
			clearInterval(flusher.timer);
			flusher.timer = null;
		}

		try {
			await flushAll();
		} catch {
			// Don't propagate
		} finally {
			flusher.counters = {};
			_bufferedCounterCache[key] = null;
		}
	};

	/**
	 * Flush all buffered counts to the counter, read back every sub-key's
	 * total, and reset them all to 0 in the counter. Returns a record of
	 * sub-key → count.
	 */
	const getAndResetAll = async (): Promise<Record<string, number>> => {
		// Flush any buffered counts so the counter has the full picture
		await flushAll();

		const subKeys = Object.keys(flusher.counters);
		const result: Record<string, number> = {};

		for (const subKey of subKeys) {
			const value = await counter.get<number>(subKey);
			result[subKey] = value ?? 0;
		}

		// Reset all sub-keys in the counter to 0 using increment with negative value
		await Promise.all(
			subKeys.map((subKey) => {
				if (result[subKey]! > 0) {
					return counter.increment(subKey, -result[subKey]!);
				}
				return Promise.resolve();
			}),
		);

		return result;
	};

	return {
		/**
		 * Increment the local buffer for a sub-key. Triggers a flush
		 * immediately if the bucket size threshold is reached.
		 *
		 * @param subKey - The sub-key to increment (e.g. "GET", "POST").
		 * @param amount - Amount to increment by. Default: 1.
		 */
		increment(subKey: string, amount: number = 1): void {
			const state = getOrCreateState(subKey);
			state.count += amount;

			if (state.count >= flusher.options.maxBucketSize) {
				void flush(subKey);
			}
		},

		/**
		 * Force flush a specific sub-key to Redis immediately.
		 */
		flush,

		/**
		 * Force flush all sub-keys to Redis immediately.
		 */
		flushAll,

		/**
		 * Read all sub-key counts and reset them to 0 in the counter.
		 * Flushes any buffered counts first to ensure accuracy.
		 */
		getAndResetAll,

		/**
		 * Stop all timers and flush remaining counts. Call on shutdown.
		 */
		destroy,
	};
};
