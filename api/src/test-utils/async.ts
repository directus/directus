/**
 * Stand-in for `Promise.withResolvers()`, which is ES2024 and so not yet typed under the
 * repo's `lib: ES2023`.
 *
 * Returns the same shape as the standard, so once the lib is bumped this can be deleted and
 * the call sites swapped over unchanged.
 *
 * Lets a test drive timing off explicit signals rather than elapsed time, so nothing depends
 * on how fast the machine running it happens to be.
 */
export function withResolvers<T = void>() {
	let resolve!: (value: T | PromiseLike<T>) => void;
	let reject!: (reason?: unknown) => void;

	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});

	return { promise, resolve, reject };
}
