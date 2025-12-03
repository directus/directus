import type { Redis } from 'ioredis';

export interface ExtendedRedis extends Redis {
	setMax(key: string, value: number): Promise<number>;
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
}

export interface KvConfigRedis extends KvConfigAbstract {
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
	 * Maximum time (in s) to wait trying to aquire a lock.
	 */
	lockTimeout?: number;

	/**
	 * Maximum time (in s) a lock will be held until it will be automatically released.
	 */
	releaseTimeout?: number;

	/**
	 * Existing or new Redis connection to use with this memory class
	 */
	redis: Redis | ExtendedRedis;
}

export type KvConfig = KvConfigLocal | KvConfigRedis;
