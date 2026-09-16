import { vi } from 'vitest';
import { withResolvers } from './async.js';

/**
 * In-memory store shared across invocations, with a serialized critical section.
 */
export function createMockStore() {
	const state = new Map<string, unknown>();
	const ops: string[] = [];

	let queue: Promise<unknown> = Promise.resolve();
	let shouldFail = false;
	let settled = 0;
	let waiters: { count: number; resolve: () => void }[] = [];

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
