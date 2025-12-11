import { getSimpleHash } from '@directus/utils';
import type { Cache } from '../cache/index.js';

type Pop<T extends any[]> = T extends [...infer U, any] ? U : never;
type Last<T extends any[]> = T extends [...any[], infer U] ? U : never;

export type ProvideFunction<T extends any[]> = (...args: T) => void;

export type InvalidateFunction = () => void;

const activeWithCaches = new Set<() => void>();
const activeInvalidators = new Set<string>();

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
	F extends (...args: any[]) => any,
	P extends Last<Parameters<F>> extends ProvideFunction<V> ? Pop<Parameters<F>> : Parameters<F>,
	V extends any[] = Parameters<F> extends [...any[], provide: ProvideFunction<infer U>] ? U : never,
>(
	namespace: string,
	handler: F,
	cache: Cache,
	prepareArg?: (...args: P) => Record<string, unknown>,
	invalidate?: (
		invalidate: InvalidateFunction,
		providedArgs: V,
		functionArgs: P,
		returnValue: Awaited<ReturnType<F>>,
	) => void,
): (...args: P) => Promise<Awaited<ReturnType<F>>> {
	return async (...args) => {
		const hashArgs = prepareArg ? prepareArg(...args) : args;
		const key = namespace + ':' + getSimpleHash(JSON.stringify(hashArgs));

		const cached = await cache.get(key);

		// If an instance starts on existing cache, we want to make sure that the invalidation logic is initialized
		if (cached !== undefined && (!invalidate || activeInvalidators.has(key))) {
			return cached as Awaited<ReturnType<F>>;
		}

		// Make a local copy of parent cached to invalidate when this cache is invalidated
		let parentActiveCaches = Array.from(activeWithCaches);

		const clearCache: InvalidateFunction = () => {
			cache.delete(key);
			activeInvalidators.delete(key);

			for (const clearParentCache of parentActiveCaches) {
				clearParentCache();
			}

			parentActiveCaches = [];
		};

		activeWithCaches.add(clearCache);

		const providedArgs: any[] = [];

		const res = await handler(...args, (...args: V) => {
			providedArgs.push(...args);
		});

		activeWithCaches.delete(clearCache);

		if (invalidate) {
			invalidate(clearCache, providedArgs as V, args, res);
			activeInvalidators.add(key);
		}

		cache.set(key, res);

		return res;
	};
}
