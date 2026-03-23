import { useEnv } from '@directus/env';
import { createKv, type Kv } from '@directus/memory';
import { redisConfigAvailable, useRedis } from '../../redis/index.js';

export const _cache: { counter: Kv | null } = { counter: null };

/**
 * Returns a shared counter kv instance, creating one if it doesn't exist.
 */
export const useCounters = () => {
	if (_cache.counter) {
		return _cache.counter;
	}

	let counter: Kv;

	if (redisConfigAvailable()) {
		const env = useEnv();
		counter = createKv({ type: 'redis', redis: useRedis(), namespace: env['REDIS_COUNTERS_NAMESPACE'] as string });
	} else {
		counter = createKv({ type: 'local' });
	}

	_cache.counter = counter;

	return counter;
};
