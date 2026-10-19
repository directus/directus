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

	/**
	 * Time-to-Live expires keys after duration in milliseconds
	 */
	ttl?: number;
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
	 * Time-to-Live expires keys after duration in milliseconds.
	 *
	 * With `hash` enabled the TTL applies to the namespace as a whole and is refreshed on every write.
	 */
	ttl?: number;

	/**
	 * Store the keys as fields of a single Redis hash named after the namespace, rather than as
	 * individual `namespace:key` keys, making `clear` a single unlink instead of a keyspace scan.
	 *
	 * The `ttl` applies to the hash as a whole; locks are unaffected as they can't live in a hash.
	 * When Redis 7.4+ becomes the only lts, we can improve this even further by using TTL + Hashsets
	 *
	 * @default false
	 */
	hash?: boolean;

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
