/**
 * Resolves with `promise` when it settles before the timeout.
 *
 * @param promise Promise to wait for.
 * @param ms How long to wait, in milliseconds.
 * @param message Message for the timeout error
 * @returns The result of `promise`.
 * @throws When the timeout expires before `promise` settles or promise rejects
 */
export function withTimeout<T>(promise: Promise<T>, ms: number, message?: string): Promise<T> {
	// TODO: Replae with Promise.withResolvers once supported
	let expire: (error: Error) => void;

	const expired = new Promise<never>((_, reject) => (expire = reject));
	const timer = setTimeout(() => expire(new Error(message ?? `Timeout of ${ms}ms exceeded`)), ms);

	return Promise.race([promise, expired]).finally(() => {
		clearTimeout(timer);
	});
}
