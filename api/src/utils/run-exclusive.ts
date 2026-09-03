import { randomUUID } from 'node:crypto';
import { useBus } from '../bus/index.js';
import { useLogger } from '../logger/index.js';
import { useStore } from './store.js';

type Outcome<T> = { ok: true; result: T } | { ok: false; error: string };

/**
 * Runs `fn` exclusively for the given key.
 *
 * If another invocation already holds the lease, waits for its result
 * instead of running `fn`.
 *
 * CAVEAT: Exclusivity requires Redis, for local no exclusivity is currently guaranteed.
 *
 * @param key Key identifying the exclusive operation.
 * @param fn Function to execute once the lease is acquired.
 * @param options Execution options.
 * @param options.timeout Maximum time to wait for the current leader's result.
 * @param options.maxAttempts Maximum number of attempts when `fn` fails.
 * @returns The operation result and whether this invocation was the leader.
 */
export async function runExclusive<T>(
	key: string,
	fn: () => Promise<T>,
	options?: { timeout?: number; maxAttempts?: number },
) {
	const channel = `directus:exclusive:${key}:bus`;
	const timeout = options?.timeout ?? 500_000;
	const maxAttempts = options?.maxAttempts ?? 3;

	// Renew often enough to tolerate a missed heartbeat without letting
	// a healthy lease expire during normal operation.
	const ttl = 10_000;
	const lease = Math.floor(ttl / 3);

	const uid = randomUUID();
	const bus = useBus();

	const store = useStore<{ leader: string }>('directus:exclusive' + key, { ttl: 10000 });

	// Subscribe before acquiring the lease so followers can't miss the result.
	const { done, cancel } = await waitForBusMessage<Outcome<T>>(channel, { timeout });

	let isLeader: boolean;

	try {
		isLeader = await store(async (store) => {
			const leader = await store.get('leader');

			// Someone else holds the lease
			if (leader) return false;

			await store.set('leader', uid);

			return true;
		});
	} catch (error) {
		await cancel();
		throw error;
	}

	if (!isLeader) {
		const outcome = await done();

		if (!outcome.ok) {
			throw new Error(outcome.error);
		}

		return { result: outcome.result, leader: false };
	}

	await cancel();

	const { cancel: cancelHeartbeat } = heartbeat(store, uid, lease);

	let outcome: Outcome<T> = { ok: false, error: 'unknown' };

	try {
		for (let attempt = 0; attempt < maxAttempts; attempt++) {
			try {
				outcome = { ok: true, result: await fn() };
				break;
			} catch (error) {
				outcome = { ok: false, error: error instanceof Error ? error.message : String(error) };
			}
		}
	} finally {
		// Release heartbeat & leader before publishing, so no window of indication that still a leader
		cancelHeartbeat();

		try {
			await store(async (store) => {
				const leader = await store.get('leader');

				// Only release if we still own the lease
				if (leader === uid) {
					await store.delete('leader');
				}
			});
		} catch (error) {
			useLogger().warn(error, `Could not release exclusive lease`);
		}
	}

	await bus.publish(channel, outcome);

	if (!outcome.ok) {
		throw new Error(outcome.error);
	}

	return { result: outcome.result, leader: true };
}

/**
 * Subscribes to a bus channel and waits for the next message.
 *
 * The subscription is automatically removed when the message is received,
 * the wait times out, or `cancel()` is called.
 *
 * @param channel Bus channel to subscribe to.
 * @param options Wait options.
 * @param options.timeout Maximum time to wait for a message.
 * @returns Controls for awaiting or cancelling the subscription.
 */
export async function waitForBusMessage<T>(channel: string, options?: { timeout?: number }) {
	const bus = useBus();
	const timeout = options?.timeout ?? 10_000;

	let resolveMessage: (payload: T) => void;

	const onMessage = (payload: T) => {
		resolveMessage(payload);
	};

	const messagePromise = new Promise<T>((res) => (resolveMessage = res));

	// Subscribe before returning so the caller cannot miss a message.
	await bus.subscribe(channel, onMessage);

	async function done() {
		try {
			return await withTimeout(messagePromise, timeout);
		} finally {
			// Always remove the subscription, including on timeout.
			await cancel();
		}
	}

	async function cancel() {
		await bus.unsubscribe(channel, onMessage).catch(() => {});
	}

	return {
		done,
		cancel,
	};
}

/**
 * Resolves with `promise` if it settles before the timeout.
 *
 * Rejects with a timeout error if `ms` elapses first.
 *
 * @param promise Promise to wait for.
 * @param ms Maximum time to wait, in milliseconds.
 * @returns The result of `promise`.
 * @throws {Error} If the timeout expires before `promise` settles.
 */
export async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
	let rejectTimeout: (error: Error) => void;
	const timeout = new Promise<never>((_, reject) => (rejectTimeout = reject));

	const timer = setTimeout(() => rejectTimeout(new Error('timeout')), ms);

	try {
		return await Promise.race([promise, timeout]);
	} finally {
		// The timer is no longer needed once the promise settles.
		clearTimeout(timer);
	}
}

function heartbeat(store: ReturnType<typeof useStore<{ leader: string }>>, uid: string, interval: number) {
	const logger = useLogger();

	const timer = setInterval(() => {
		store(async (store) => {
			const leader = await store.get('leader');

			if (leader === uid) {
				await store.set('leader', uid);
			}
		}).catch((error) => {
			logger.warn(error, `Could not renew exclusive lease`);
		});
	}, interval);

	function cancel() {
		clearInterval(timer);
	}

	return { cancel };
}
