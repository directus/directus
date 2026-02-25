import { createKv, type Kv } from '@directus/memory';
import { redisConfigAvailable, useRedis } from '../../redis/index.js';

export const _cache: Record<string, Kv> = {};

/**
 * Returns a counter kv instance for the given key, creating one if it doesn't exist.
 */
export const useCounter = (key: string) => {
	if (_cache[key]) {
		return _cache[key];
	}

	let counter: Kv;

	if (redisConfigAvailable()) {
		counter = createKv({ type: 'redis', redis: useRedis(), namespace: `directus:counter:${key}` });
	} else {
		counter = createKv({ type: 'local' });
	}

	_cache[key] = counter;

	return counter;
};
