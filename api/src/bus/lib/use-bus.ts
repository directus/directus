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
		_cache.bus = createBus({ type: 'redis', redis: useRedis(), namespace: 'directus:bus' });
	} else {
		_cache.bus = createBus({ type: 'local' });
	}

	return _cache.bus;
};
