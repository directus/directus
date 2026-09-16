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
		clearTimeout(timer);
	}
}
