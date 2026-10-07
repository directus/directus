import { vi } from 'vitest';
import { withResolvers } from './async.js';

/**
 * In-memory store shared across invocations, with a serialized critical section.
 *
 * Keys expire after `ttl`, the way a leased key does in redis, so what a caller finds once a
 * holder stops renewing can be tested.
 */
export function createMockStore(options?: { ttl?: number }) {
	const ttl = options?.ttl ?? 10_000;
	const entries = new Map<string, { value: unknown; expiresAt: number }>();
	const ops: string[] = [];

	let queue: Promise<unknown> = Promise.resolve();
	let shouldFail = false;
	let settled = 0;
	let waiters: { count: number; resolve: () => void }[] = [];

	function read(key: string) {
		const entry = entries.get(key);

		if (!entry) return undefined;

		if (Date.now() >= entry.expiresAt) {
			entries.delete(key);
			return undefined;
		}

		return entry;
	}

	/** The stored state, for seeding and asserting */
	const state = {
		get: (key: string) => read(key)?.value,
		set: (key: string, value: unknown) => entries.set(key, { value, expiresAt: Date.now() + ttl }),
		has: (key: string) => read(key) !== undefined,
		delete: (key: string) => entries.delete(key),
	};

	function recordSettled() {
		settled++;

		waiters = waiters.filter((waiter) => {
			if (settled < waiter.count) return true;

			waiter.resolve();

			return false;
		});
	}

	const store = vi.fn((callback: (store: any) => Promise<unknown>) => {
		const run = () => {
			if (shouldFail) throw new Error('store unavailable');

			return callback({
				has: async (key: string) => state.has(key),
				get: async (key: string) => {
					ops.push(`get:${key}`);
					return state.get(key);
				},
				set: async (key: string, value: unknown) => {
					ops.push(`set:${key}`);
					state.set(key, value);
				},
				delete: async (key: string) => {
					ops.push(`delete:${key}`);
					state.delete(key);
				},
			});
		};

		const result = queue.then(run, run);

		queue = result.catch(() => {});
		result.then(recordSettled, recordSettled);

		return result;
	});

	return {
		store,
		state,
		ops,
		/**
		 * Resolves once `count` store operations have settled.
		 */
		whenSettled: (count: number) => {
			if (settled >= count) return Promise.resolve();

			const waiter = withResolvers();
			waiters.push({ count, resolve: waiter.resolve });

			return waiter.promise;
		},
		fail: () => (shouldFail = true),
	};
}
