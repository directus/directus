/** Thrown when a timeout expires before the awaited promise settles */
export class TimeoutError extends Error {
	override name = 'TimeoutError';
}

/**
 * Resolves with `promise` when it settles before the timeout.
 *
 * @param promise Promise, or plain value, to wait for.
 * @param ms How long to wait, in milliseconds. `Infinity` waits indefinitely.
 * @param message Message for the timeout error
 * @returns The result of `promise`.
 * @throws When the timeout expires before `promise` settles or promise rejects
 */
export function withTimeout<T>(promise: T | PromiseLike<T>, ms: number, message?: string): Promise<T> {
	// setTimeout fires delays above 2^31-1 almost immediately, skip timer
	if (!Number.isFinite(ms)) return Promise.resolve(promise);

	// TODO: Replae with Promise.withResolvers once supported
	let expire: (error: Error) => void;

	const expired = new Promise<never>((_, reject) => (expire = reject));
	const timer = setTimeout(() => expire(new TimeoutError(message ?? `Timeout of ${ms}ms exceeded`)), ms);

	return Promise.race([promise, expired]).finally(() => {
		clearTimeout(timer);
	});
}
