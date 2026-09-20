import { randomUUID } from 'node:crypto';
import { useEnv } from '@directus/env';
import { useBus } from '../bus/index.js';
import { useLogger } from '../logger/index.js';
import { useStore } from './store.js';
import { waitForBusMessage } from './wait-for-bus-message.js';
import { withTimeout } from './with-timeout.js';

type Outcome<T> = { ok: true; result: T } | { ok: false; error: string };

type Lease = { leader: string };

/** How long the lease survives without being renewed */
const LEASE_TTL = 10_000;

const RENEW_INTERVAL = Math.floor(LEASE_TTL / 4);

const LEADER_CHECK_INTERVAL = LEASE_TTL + RENEW_INTERVAL;

export type RunExclusiveOptions = {
	/** How long to wait for a result before giving up, in milliseconds @default 300_000 */
	timeout?: number;
	/** How often the leader may attempt `fn` before reporting failure @default 1 */
	maxAttempts?: number;
};

/**
 * Runs `fn` exactly once across all instances for the given key.
 * One instance acquires the lease and executes `fn`; all other instances
 * wait for the result and receive it once the execution completes.
 *
 * CAVEAT: Cross-instance requires Redis. In-process exclusivity is
 * not currently supported when Redis is unavailable.
 *
 * @param key Key identifying the exclusive operation.
 * @param fn Function to execute once the lease is acquired.
 * @param options Execution options.
 * @returns The outcome of `fn` and whether this invocation executed it.
 */
export async function runExclusive<T>(
	key: string,
	fn: () => Promise<T> | T,
	options?: RunExclusiveOptions,
): Promise<{ result: T; leader: boolean }> {
	const env = useEnv();
	const bus = useBus();
	const logger = useLogger();

	const timeout = options?.timeout ?? 300_000;
	const maxAttempts = Math.max(options?.maxAttempts ?? 1, 1);

	const namespace = `${(env['REDIS_LOCK_NAMESPACE'] as string) ?? 'directus:lock'}:${key}`;
	const channel = `exclusive:${key}`;

	const uid = randomUUID();
	const deadline = Date.now() + timeout;
	const leaseStore = useStore<Lease>(namespace, { ttl: LEASE_TTL });

	function remaining() {
		return deadline - Date.now();
	}

	/**
	 * Attempts to claim lead, if lead exists then follow
	 *
	 * @returns boolean whether claimed lead or not
	 */
	function attemptClaim(): Promise<boolean> {
		return leaseStore(async (store) => {
			const holder = await store.get('leader');

			if (holder && holder !== uid) return false;

			await store.set('leader', uid);

			return true;
		}).catch((error) => {
			logger.warn(error, `Could not hold the exclusive lease for "${key}"`);

			return false;
		});
	}

	/**
	 * Attempt to release claim, if still leader then released
	 *
	 * @returns boolean whether claim was released
	 */
	function releaseClaim() {
		return leaseStore(async (store) => {
			const claim = await store.get('leader');

			if (claim !== uid) return false;

			await store.delete('leader');

			return true;
		}).catch((error) => {
			logger.warn(error, `Could not release the exclusive lease for "${key}"`);

			return true;
		});
	}

	/**
	 * Runs `fn`, retrying until maxAttempts
	 *
	 * @returns Result of the fn
	 * @throws No attempts remaining or timed out
	 */
	async function runFn(): Promise<T> {
		let failure: unknown;

		for (let attempts = 1; attempts <= maxAttempts; attempts++) {
			if (remaining() <= 0) {
				throw new Error(`Exclusive run for "${key}" timed out after ${timeout}ms`);
			}

			try {
				return await fn();
			} catch (error) {
				failure = error;

				logger.warn(error, `Exclusive run for "${key}" failed (${attempts}/${maxAttempts})`);
			}
		}

		throw failure ?? new Error(`Exclusive run for "${key}" failed allowed attempts`);
	}

	/**
	 * Runs `fn` while holding the lease, and publishes the outcome to the followers
	 */
	async function lead(): Promise<T> {
		let renewal: Promise<unknown> = Promise.resolve();

		// lease "heatbeat"
		const renewalTimer = setInterval(() => {
			renewal = attemptClaim();
		}, RENEW_INTERVAL);

		let outcome: Outcome<T>;
		let cause: unknown;

		try {
			const result = await withTimeout(runFn(), remaining(), `Exclusive run for "${key}" timed out after ${timeout}ms`);

			outcome = { ok: true, result };
		} catch (error) {
			cause = error;
			outcome = { ok: false, error: error instanceof Error ? error.message : String(error) };
		}

		clearInterval(renewalTimer);

		// Wait for any in-flight renewal to complete
		await renewal;

		if (await releaseClaim()) {
			// If this was still the leader, publish the outcome
			await bus.publish(channel, outcome).catch((error) => {
				logger.warn(error, `Could not publish the exclusive result for "${key}"`);
			});
		}

		if (!outcome.ok) throw cause;

		return outcome.result;
	}

	for (let round = 0; remaining() > 0; round++) {
		// Listen before reading the lease, so a result published in between is caught
		const listener = await waitForBusMessage<Outcome<T>>(channel, {
			timeout: Math.min(LEADER_CHECK_INTERVAL, remaining()),
		});

		const leading = await attemptClaim();

		if (remaining() <= 0) {
			await listener.cancel();

			if (leading) await releaseClaim();

			break;
		} else if (leading) {
			await listener.cancel();

			// A free lease on a later round means we had a takeover
			if (round > 0) logger.warn(`Exclusive run for "${key}" lost its leader, taking over`);

			return { result: await lead(), leader: true };
		}

		// Silence says nothing on its own, the next round reads the lease instead
		const outcome = await listener.done().catch(() => undefined);

		if (outcome) {
			if (!outcome.ok) throw new Error(outcome.error);

			return { result: outcome.result, leader: false };
		}
	}

	throw new Error(`Exclusive run for "${key}" timed out after ${timeout}ms`);
}
