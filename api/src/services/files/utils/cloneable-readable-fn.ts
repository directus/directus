import { type Cloneable } from 'cloneable-readable';
import type { Readable } from 'node:stream';

/**
 * Wrapper function allowing safe usage of a cloneable readable.
 */
export function cloneableReadableFn<T extends (cloneFn: () => Cloneable<Readable>) => Promise<any>>(
	cloneableReadable: Cloneable<Readable>,
	fn: T,
	options?: {
		/** Whether to destroy only the cloned readable instead of the original one on error */
		destroyClone?: boolean;
	},
) {
	let clone: Cloneable<Readable>;

	const cloneFn = () => {
		clone = cloneableReadable.clone();
		return clone;
	};

	const result = fn(cloneFn)
		.then((value) => ({ value }))
		.catch((error: unknown) => {
			const destroyReadable = options?.destroyClone ? clone : cloneableReadable;

			destroyReadable.resume();
			destroyReadable.destroy();

			return { error: error instanceof Error ? error : new Error(String(error)) };
		}) as Promise<
		| {
				value: Awaited<ReturnType<T>>;
				error?: never;
		  }
		| {
				value?: never;
				error: Error;
		  }
	>;

	return result;
}
