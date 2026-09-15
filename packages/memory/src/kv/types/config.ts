import type { Redis } from 'ioredis';

export interface ExtendedRedis extends Redis {
	setMax(key: string, value: number): Promise<number>;
	setMaxField(hash: string, field: string, value: number, ttl: number): Promise<number>;
	release(key: string, value: string): Promise<number>;
}

export interface KvConfigAbstract {
	/**
	 * Where the data is stored
	 *
	 * `local` - Local memory
	 * `redis` - Redis instance
	 */
	type: 'local' | 'redis';
}

export interface KvConfigLocal extends KvConfigAbstract {
	type: 'local';

	/**
	 * Maximum number of keys in the store
	 */
	maxKeys?: number;

	/**
	 * Time-to-Live expires keys after duration in milliseconds
	 */
	ttl?: number;
}

export interface KvConfigRedis extends KvConfigAbstract {
	type: 'redis';

	/**
	 * Used to prefix the keys, or to name the hash the keys are kept in when `hash` is enabled
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
	 * Requested lock duration in miliseconds
	 */
	lockTimeout?: number;

	/**
	 * Existing or new Redis connection to use with this memory class
	 */
	redis: Redis | ExtendedRedis;

	/**
	 * Time-to-Live expires keys after duration in milliseconds
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
}

export type KvConfig = KvConfigLocal | KvConfigRedis;
