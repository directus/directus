import { createRedis } from './create-redis.js';
import { Redis } from 'ioredis';

/**
 * Memoization cache for useRedis
 *
 * @see {@link useRedis}
 */
export const _cache: { redis: Redis | undefined } = {
	redis: undefined,
};

/**
 * Access the globally shared Redis instance
 * Creates new Redis instance on first invocation
 *
 * @returns Globally shared Redis instance
 */
export const useRedis = () => {
	if (_cache.redis) return _cache.redis;

	_cache.redis = createRedis();

	return _cache.redis;
};
