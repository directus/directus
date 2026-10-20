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
		const { REDIS_COUNTERS_NAMESPACE } = useEnv();

		counter = createKv({
			type: 'redis',
			redis: useRedis(),
			namespace: REDIS_COUNTERS_NAMESPACE,
		});
	} else {
		counter = createKv({ type: 'local' });
	}

	_cache.counter = counter;

	return counter;
};
