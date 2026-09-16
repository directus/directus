import { randomUUID } from 'node:crypto';
import { useEnv } from '@directus/env';
import { useBus } from '../../bus/index.js';
import { useLogger } from '../../logger/index.js';
import { useStore } from '../store.js';
import { waitForBusMessage } from './wait-for-bus-message.js';

type Outcome<T> = { ok: true; result: T } | { ok: false; error: string };

type HeartbeatMessage = { type: 'heartbeat' };
type ResultMessage<T> = { type: 'result'; outcome: Outcome<T> };
type Message<T> = HeartbeatMessage | ResultMessage<T>;

// How long a lease survives without being renewed.
const LEASE_TTL = 10_000;

// Renew and announce often enough to account for missed renewals
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

	await useBus().publish(busChannel, { type: 'result', outcome } satisfies ResultMessage<T>);

	if (!outcome.ok) {
		throw new Error(`Exclusive run for "${key}" failed`, { cause: outcome.error });
	}

	return { result: outcome.result, leader: true };
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

			// The lease has been taken over, so another invocation may already be running `fn`.
			// Stop telling followers to keep waiting on this one.
			if (renewed) notifyFollowers();
		} catch (error) {
			logger.warn(error, `Could not renew exclusive lease`);

			// An unreachable store says nothing about who holds the lease, so the followers
			// are still better off knowing this invocation is alive.
			notifyFollowers();
		}
	}

	// A dropped beat must not reject in the followers' place
	function notifyFollowers() {
		bus.publish(channel, { type: 'heartbeat' } satisfies HeartbeatMessage).catch((error) => {
			logger.warn(error, `Could not publish exclusive heartbeat`);
		});
	}

	function cancel() {
		clearInterval(timer);
	}

	return { cancel };
}
