import { randomUUID } from 'node:crypto';
import { useEnv } from '@directus/env';
import { useBus } from '../bus/index.js';
import { useLogger } from '../logger/index.js';
import { useStore } from './store.js';

type Outcome<T> = { ok: true; result: T } | { ok: false; error: string };

type HeartbeatMessage = { type: 'heartbeat' };
type ResultMessage<T> = { type: 'result'; outcome: Outcome<T> };
type Message<T> = HeartbeatMessage | ResultMessage<T>;

// How long a lease survives without being renewed.
const LEASE_TTL = 10_000;

// Renew and announce often enough to account for missed renewels
const HEARTBEAT_INTERVAL = Math.floor(LEASE_TTL / 3);

// How long a follower waits for the next heartbeat before giving up
const HEARTBEAT_TIMEOUT = LEASE_TTL;

/**
 * Runs `fn` exclusively for the given key.
 *
 * If another invocation already holds the lease, waits for its result
 * instead of running `fn`.
 *
 * The leader heartbeats to its followers. A follower that stops
 * receiving heartbeats gives up rather than waiting out the full timeout.
 *
 * CAVEAT: Exclusivity requires Redis, local currently has no exclusivity
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
	fn: () => Promise<T> | T,
	options?: { timeout?: number; maxAttempts?: number },
) {
	const env = useEnv();

	const namespace = (env['REDIS_EXCLUSIVE_NAMESPACE'] as string) ?? 'directus:exclusive';
	const busChannel = `${namespace}:${key}:bus`;
	const timeout = options?.timeout ?? 300_000;
	const maxAttempts = options?.maxAttempts ?? 1;

	// Subscribe before acquiring the lease so followers won't miss a result
	const { done, cancel } = await waitForBusMessage<Message<T>, ResultMessage<T>>(busChannel, {
		timeout,
		idleTimeout: HEARTBEAT_TIMEOUT,
		accept: (message) => message.type === 'result',
	});

	let isLeader: boolean;
	const uid = randomUUID();
	const store = useStore<{ leader: string }>(`${namespace}:${key}`, { ttl: LEASE_TTL });

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
		const { outcome } = await done();

		// on timeout or leader heartbeat stops
		if (!outcome.ok) {
			throw new Error(outcome.error);
		}

		return { result: outcome.result, leader: false };
	}

	// Leader should not listen to its own messages
	await cancel();

	const { cancel: cancelHeartbeat } = heartbeat(store, busChannel, uid, HEARTBEAT_INTERVAL);

	let outcome: Outcome<T> = { ok: false, error: 'unknown' };
	const startedAt = Date.now();

	try {
		for (let attempt = 0; attempt < maxAttempts; attempt++) {
			try {
				outcome = { ok: true, result: await fn() };
			} catch (error) {
				outcome = { ok: false, error: error instanceof Error ? error.message : String(error) };
			}

			// Followers stopped waiting, so no one left to hand a result to
			if (Date.now() - startedAt > timeout) {
				outcome = { ok: false, error: `Exclusive run for "${key}" exceeded ${timeout}ms` };
				break;
			}

			if (outcome.ok) break;
		}
	} finally {
		// Release heartbeat & leader before publishing, so no window of indication that still a leader
		cancelHeartbeat();

		await store(async (store) => {
			const leader = await store.get('leader');

			// Only release if we still own the lease
			if (leader === uid) {
				await store.delete('leader');
			}
		}).catch((error) => {
			useLogger().warn(error, `Could not release exclusive lease`);
		});
	}

	await useBus().publish(busChannel, { type: 'result', outcome });

	if (!outcome.ok) {
		throw new Error(`Exclusive run for "${key}" failed`, { cause: outcome.error });
	}

	return { result: outcome.result, leader: true };
}

/**
 * Subscribes to a bus channel and waits for the next accepted message.
 *
 * The subscription is automatically removed on any "done" (message is accepted, timeout expires, etc) event
 *
 * @param channel Bus channel to subscribe to.
 * @param options Wait options.
 * @param options.timeout Maximum time to wait for an accepted message.
 * @param options.idleTimeout Maximum time to wait between messages of any kind.
 * @param options.accept Which message ends the wait, defaults to the next message.
 *
 */
export async function waitForBusMessage<T, Accepted extends T = T>(
	channel: string,
	options?: {
		timeout?: number;
		idleTimeout?: number;
		accept?: (payload: T) => payload is Accepted;
	},
) {
	const bus = useBus();
	const timeout = options?.timeout ?? 10_000;
	const idleTimeout = options?.idleTimeout;
	const accept = options?.accept ?? ((_payload: T): _payload is Accepted => true);

	let resolveMessage: (payload: Accepted) => void;
	let rejectMessage: (error: Error) => void;

	const messagePromise = new Promise<Accepted>((res, rej) => {
		resolveMessage = res;
		rejectMessage = rej;
	});

	let idleTimer: NodeJS.Timeout | undefined;

	// Only account for idle once listing to done
	let waiting = false;

	function armIdleTimer() {
		if (idleTimeout === undefined) return;

		clearTimeout(idleTimer);

		idleTimer = setTimeout(
			() => rejectMessage(new Error(`Stalled after ${idleTimeout}ms without message on ${channel}`)),
			idleTimeout,
		);
	}

	const onMessage = (payload: T) => {
		// Any message marks publisher as still alive, extend lifetime
		if (waiting) armIdleTimer();

		if (accept(payload)) {
			resolveMessage(payload);
		}
	};

	// Subscribe before returning so the caller cannot miss a message
	await bus.subscribe(channel, onMessage);

	function done() {
		waiting = true;
		armIdleTimer();

		return withTimeout(messagePromise, timeout).finally(async () => {
			// Always remove the subscription, including on timeout.
			await cancel();
		});
	}

	async function cancel() {
		waiting = false;
		clearTimeout(idleTimer);

		await bus.unsubscribe(channel, onMessage).catch((error) => {
			useLogger().warn(error, `Could not release bus listener`);
		});
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

	const timer = setTimeout(() => rejectTimeout(new Error(`Timeout of ${ms}ms exceeded`)), ms);

	try {
		return await Promise.race([promise, timeout]);
	} finally {
		// The timer is no longer needed once the promise settles.
		clearTimeout(timer);
	}
}

/**
 * Keeps the lease alive and tells followers the leader is still working
 *
 * @param store Store holding the lease.
 * @param channel Bus channel the followers listen on.
 * @param uid Identifier of the current leader.
 * @param interval How often to renew and announce.
 *
 */
function heartbeat(
	store: ReturnType<typeof useStore<{ leader: string }>>,
	channel: string,
	uid: string,
	interval: number,
) {
	const logger = useLogger();
	const bus = useBus();

	const timer = setInterval(beat, interval);

	async function beat() {
		try {
			const renewed = await store(async (store) => {
				// Only renew if we still own the lease
				if ((await store.get('leader')) !== uid) return false;

				await store.set('leader', uid);

				return true;
			});

			if (renewed) notifyFollowers();
		} catch (error) {
			logger.warn(error, `Could not renew exclusive lease`);

			notifyFollowers();
		}
	}

	// A dropped beat must not reject in the followers' place
	function notifyFollowers() {
		bus.publish(channel, { type: 'heartbeat' }).catch((error) => {
			logger.warn(error, `Could not publish exclusive heartbeat`);
		});
	}

	function cancel() {
		clearInterval(timer);
	}

	return { cancel };
}
