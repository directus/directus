import { vi } from 'vitest';

/**
 * In-memory stand-in for the lock kv, refusing a held key the way redlock does with `retryCount: 0`.
 *
 * `abandon` frees the key without going through the holder, standing in for a process that went
 * away and let its lease expire, which aborts the signal the displaced holder was given.
 */
export function createMockLock() {
	const holders = new Map<string, AbortController>();

	let shouldFail = false;

	const usingLock = vi.fn(async (key: string, callback: (signal: AbortSignal) => Promise<unknown>) => {
		if (shouldFail) throw new Error('lock unavailable');
		if (holders.has(key)) throw new Error('lock held');

		const lease = new AbortController();
		holders.set(key, lease);

		try {
			return await callback(lease.signal);
		} finally {
			if (holders.get(key) === lease) holders.delete(key);
		}
	});

	return {
		lock: { usingLock },
		/** Free the key as if the holder's lease had expired */
		abandon(key: string) {
			holders.get(key)?.abort();
			holders.delete(key);
		},
		/** Occupy the key as if another instance held it */
		hold(key: string) {
			holders.set(key, new AbortController());
		},
		isHeld: (key: string) => holders.has(key),
		fail: () => (shouldFail = true),
	};
}
