import type { Redis } from 'ioredis';

export interface MemoryConfigAbstract {
	/**
	 * Where the data is stored
	 *
	 * `local` - Local memory
	 * `redis` - Redis instance
	 * `multi` - Multi-stage cache. In-memory as L1, Redis as L2
	 */
	type: 'local' | 'redis' | 'multi';

	/**
	 * Enable Brotli compression
	 *
	 * @default true
	 */
	compression?: boolean;

	/**
	 * Maximum buffer size to attempt to store in the cache
	 */
	maxEntrySize?: number;

	/**
	 * Time to live in ms for the cached value
	 */
	ttl?: number;
}

export interface MemoryConfigLocal extends MemoryConfigAbstract {
	type: 'local';

	/**
	 * Maximum number of keys to store in the cache
	 */
	maxKeys: number;

	/**
	 * Maximum memory usage of the cache
	 */
	maxSize: number;
}

export interface MemoryConfigRedis extends MemoryConfigAbstract {
	type: 'redis';

	/**
	 * Used to prefix the keys in Redis
	 */
	namespace: string;

	/**
	 * Existing or new Redis connection to use with this memory class
	 */
	redis: Redis;
}

export interface MemoryConfigMulti extends MemoryConfigAbstract {
	type: 'multi';

	/**
	 * Configuration for the L1 cache
	 */
	local: Omit<MemoryConfigLocal, 'type'>;

	/**
	 * Configuration for the L2 cache
	 */
	redis: Omit<MemoryConfigRedis, 'type'>;
}

export type MemoryConfig = MemoryConfigLocal | MemoryConfigRedis | MemoryConfigMulti;
