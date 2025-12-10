import { getSimpleHash } from '@directus/utils';
import { useCache } from '../cache.js';

type Pop<T extends any[]> = T extends [...infer U, any] ? U : never;
export type InvalidateFunction = () => void;

const activeWithCaches = new Set<() => void>();

/**
 * Wraps a function with caching capabilities.
 *
 * @param namespace - A unique namespace for the cache key.
 * @param handler - The function to be wrapped.
 * @param prepareArg - Optional function to prepare arguments for hashing.
 * @returns A new function that caches the results of the original function.
 *
 * @NOTE Ensure that the `namespace` is unique to avoid cache key collisions.
 * @NOTE Ensure that the `prepareArg` function returns a JSON stringifiable representation of the arguments.
 */
export function withCache<
	F extends (...args: [...Pop<Parameters<F>>, invalidate: InvalidateFunction]) => any,
	P extends Pop<Parameters<F>>,
>(
	namespace: string,
	handler: F,
	prepareArg?: (...args: P) => Record<string, unknown>,
	invalidate?: (invalidate: InvalidateFunction, ...args: P) => void,
): (...args: P) => Promise<Awaited<ReturnType<F>>> {
	const cache = useCache();

	return async (...args) => {
		const hashArgs = prepareArg ? prepareArg(...args) : args;
		const key = namespace + '-' + getSimpleHash(JSON.stringify(hashArgs));

		const cached = await cache.get(key);

		if (cached !== undefined) {
			return cached as Awaited<ReturnType<F>>;
		}

		// Make a local copy of parent cached to invalidate when this cache is invalidated
		let parentActiveCaches = Array.from(activeWithCaches);

		const clearCache: InvalidateFunction = () => {
			cache.delete(key);

			for (const clearParentCache of parentActiveCaches) {
				clearParentCache();
			}

			parentActiveCaches = [];
		};

		if (invalidate) invalidate(clearCache, ...args);

		activeWithCaches.add(clearCache);

		const res = await handler(...args, clearCache);

		activeWithCaches.delete(clearCache);

		cache.set(key, res);

		return res;
	};
}
