import { getSimpleHash } from '@directus/utils';
import { useCache } from '../cache.js';

/**
 * @NOTE only uses the first parameter for memoization
 */
export function withCache<F extends (arg0: any, ...args: any[]) => R, R, Arg0 = Parameters<F>[0]>(
	namespace: string,
	handler: F,
	pick?: (arg0: any) => Arg0,
) {
	const cache = useCache();

	return (async (arg0: Arg0, ...args: any[]) => {
		arg0 = pick ? pick(arg0) : arg0;
		const key = namespace + '-' + getSimpleHash(JSON.stringify(arg0));
		const cached = await cache.get(key);

		if (cached !== undefined) {
			return cached as R;
		}

		const res = await handler(arg0, ...args);

		cache.set(key, res);

		return res;
	}) as F;
}
