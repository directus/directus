import { useBus } from '../bus/index.js';
import { useLock } from '../lock/index.js';
import { useLogger } from '../logger/index.js';
import { withTimeout } from './with-timeout.js';

type Outcome<T, E = string> = { ok: true; result: T } | { ok: false; error: E };

export type RunExclusiveResult<T> = { result: T; leader: boolean };

export type RunExclusiveOptions = {
	/**
	 * How long to wait for a result before giving up, in ms.
	 * Taken from the caller that starts the run; callers joining it in this process share its deadline.
	 * @default 300_000
	 */
	timeout?: number;
	/** How long the lock lasts without a refresh, in ms @default 15_000 */
	lease?: number;
};

/** Runs in flight in this process, so concurrent local callers share one election */
export const inflight = new Map<string, Promise<RunExclusiveResult<unknown>>>();

/**
 * Runs `fn` once across all instances for the given key.
 * One caller takes the lock and executes `fn`, the rest wait for its outcome.
 *
 * Not a guarantee: a leader that loses its lock mid-run is replaced while its `fn` carries on,
 * so `fn` should be idempotent
 *
 * @param key Key identifying the exclusive operation.
 * @param fn Function to execute.
 * @param options Execution options.
 * @returns The outcome of `fn` and whether this invocation executed it.
 */
export function runExclusive<T>(
	key: string,
	fn: () => Promise<T> | T,
	options?: RunExclusiveOptions,
): Promise<RunExclusiveResult<T>> {
	const existing = inflight.get(key) as Promise<RunExclusiveResult<T>> | undefined;

	if (existing) return existing.then(({ result }) => ({ result, leader: false }));

	// unified timeout for caller and worker
	const timeout = options?.timeout ?? 300_000;
	const expired = `Exclusive run "${key}" timed out after ${timeout}ms`;

	const instance = new ExclusiveRun(key, fn, { timeout, lease: options?.lease ?? 15_000, expired });

	const pending = withTimeout(instance.run(), timeout, expired).finally(() => inflight.delete(key));

	inflight.set(key, pending);

	return pending;
}

class ExclusiveRun<T> {
	private readonly bus = useBus();
	private readonly lock = useLock();
	private readonly logger = useLogger();

	/** Bus channel the leader publishes the outcome on */
	private readonly channel: string;
	/** When the run should stop, as a timestamp in ms */
	private readonly deadline: number;
	/** How long the lock lasts without a refresh, in ms */
	private readonly lease: number;
	/** Error message for a run that hit its deadline */
	private readonly expired: string;

	/** Whether an outcome has already arrived on the bus */
	private received = false;

	constructor(
		private readonly key: string,
		private readonly fn: () => Promise<T> | T,
		options: Required<RunExclusiveOptions> & { expired: string },
	) {
		this.channel = `exclusive:${key}`;
		this.deadline = Date.now() + options.timeout;
		this.lease = options.lease;
		this.expired = options.expired;
	}

	/**
	 * Attempt to run the function as leader, if already running, wait for the result
	 */
	async run(): Promise<RunExclusiveResult<T>> {
		let followed = false;

		// TODO: Replace with Promise.withResolvers once supported
		let deliver!: (outcome: Outcome<T>) => void;

		const published = new Promise<Outcome<T>>((resolve) => (deliver = resolve));

		const onMessage = (outcome: Outcome<T>) => {
			this.received = true;
			deliver(outcome);
		};

		// Listen before trying lock so an outcome published in between is caught
		await this.bus.subscribe(this.channel, onMessage);

		try {
			while (true) {
				const led = await this.tryLead();

				if (led) {
					if (followed) {
						this.logger.warn(`Exclusive run "${this.key}" taken over: no outcome from previous leader`);
					}

					if (!led.ok) throw led.error;

					return { result: led.result, leader: true };
				}

				followed = true;

				// As a follower, wait for rety (lease ending) or message from leader
				const outcome = await withTimeout(published, Math.min(this.lease, this.remaining())).catch(() => {
					// ignore, timeout means nothing published this lease, not a failure
				});

				if (outcome) {
					if (!outcome.ok) throw new Error(outcome.error);

					return { result: outcome.result, leader: false };
				}

				if (this.remaining() <= 0) throw new Error(this.expired);
			}
		} finally {
			await this.bus.unsubscribe(this.channel, onMessage).catch((error) => {
				this.logger.warn(error, `Exclusive run "${this.key}" could not unsubscribe`);
			});
		}
	}

	/**
	 * Attempt to lead (i.e. execute `fn`)
	 *
	 * @returns the outcome of `fn`, or `undefined` when someone else holds the lock
	 */
	private async tryLead(): Promise<Outcome<T, unknown> | undefined> {
		let outcome: Outcome<T, unknown> | undefined;

		try {
			await this.lock.usingLock(
				this.key,
				async (signal) => {
					// An outcome landed while taking the lock, or the caller already gave up, so there is nothing left to run
					if (this.received || this.remaining() <= 0) return;

					outcome = await this.runFn(signal);
				},
				{
					duration: this.lease,
					// Try once, wait for outcome or lease end instead of retrying/requing lock while held
					retryCount: 0,
				},
			);
		} catch (error) {
			// Either the lock is held elsewhere or it could not be released, not a failure state
			this.logger.debug(error, `Exclusive run "${this.key}" did not get the lock`);
		}

		return outcome;
	}

	/**
	 * Runs `fn` while holding the lock, and shares its outcome if still leading
	 *
	 * @returns the outcome of `fn`
	 */
	private async runFn(signal: AbortSignal): Promise<Outcome<T, unknown>> {
		let outcome: Outcome<T, unknown>;

		try {
			const result = await withTimeout(this.fn(), this.remaining(), this.expired);
			outcome = { ok: true, result };
		} catch (error) {
			outcome = { ok: false, error };
		}

		// Error only on lost instance, takeover will ensure the rest continue to run
		if (signal.aborted) {
			this.logger.warn(`Exclusive run "${this.key}" lost its lock before finishing`);
			return outcome;
		}

		const message: Outcome<T> = outcome.ok
			? outcome
			: { ok: false, error: outcome.error instanceof Error ? outcome.error.message : String(outcome.error) };

		await this.bus.publish(this.channel, message).catch((error) => {
			this.logger.warn(error, `Exclusive run "${this.key}" could not publish its outcome`);
		});

		return outcome;
	}

	/** Time left before the deadline, in ms */
	private remaining(): number {
		return this.deadline - Date.now();
	}
}
