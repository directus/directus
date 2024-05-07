import { getSimpleHash } from '@directus/utils';
import { useCache } from '../cache.js';

export function withCache<F extends (...args: any[]) => any>(namespace: string, handler: F) {
	const cache = useCache();

	const fn = async (...args: any[]) => {
		const key = namespace + '-' + getSimpleHash(JSON.stringify(args[0]));
		const cached = await cache.get(key);

		if (cached) {
			return cached;
		}

		const res = await handler(...args);

		cache.set(key, res);

		return res;
	};

	return fn as F;
}
