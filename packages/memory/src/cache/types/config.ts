import type { Redis } from 'ioredis';

export interface CacheConfigAbstract {
	/**
	 * Where the data is stored
	 *
	 * `local` - Local memory
	 * `redis` - Redis instance
	 * `multi` - Multi-stage cache. In-memory as L1, Redis as L2
	 */
	type: 'local' | 'redis' | 'multi';
}

export interface CacheConfigLocal extends CacheConfigAbstract {
	type: 'local';

	/**
	 * Maximum number of keys to store in the cache
	 */
	maxKeys?: number;
}

export interface CacheConfigRedis extends CacheConfigAbstract {
	type: 'redis';

	/**
	 * Used to prefix the keys
	 */
	namespace: string;

	/**
	 * Enable Gzip compression
	 *
	 * @default true
	 */
	compression?: boolean;

	/**
	 * Minimum byte size of the value before compression is enabled.
	 *
	 * There's a trade-off in size versus time spent compressing values with Gzip. For values lower
	 * than ~1k in byte size, the juice isn't worth the squeeze
	 *
	 * @default 1000
	 */
	compressionMinSize?: number;

	/**
	 * Existing or new Redis connection to use with this memory class
	 */
	redis: Redis;
}

export interface CacheConfigMulti extends CacheConfigAbstract {
	type: 'multi';

	/**
	 * Configuration for the L1 cache
	 */
	local: Omit<CacheConfigLocal, 'type'>;

	/**
	 * Configuration for the L2 cache
	 */
	redis: Omit<CacheConfigRedis, 'type'>;
}

export type CacheConfig = CacheConfigLocal | CacheConfigRedis | CacheConfigMulti;
