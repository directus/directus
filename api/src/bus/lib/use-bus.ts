import { useEnv } from '@directus/env';
import { type Bus, createBus } from '@directus/memory';
import { redisConfigAvailable, useRedis } from '../../redis/index.js';

export const _cache: { bus: Bus | undefined } = {
	bus: undefined,
};

/**
 * Returns globally shared message bus. If Redis is available, will use a redis-driven pub/sub bus.
 * Otherwise will default to a local-only bus.
 */
export const useBus = () => {
	if (_cache.bus) {
		return _cache.bus;
	}

	if (redisConfigAvailable()) {
		const env = useEnv();

		_cache.bus = createBus({
			type: 'redis',
			redis: useRedis(),
			namespace: (env['REDIS_BUS_NAMESPACE'] as string) ?? 'directus:bus',
		});
	} else {
		_cache.bus = createBus({ type: 'local' });
	}

	return _cache.bus;
};
