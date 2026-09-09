import type { Redis } from 'ioredis';

/**
 * Custom commands defined by {@link KvRedis}. The `kv`-prefixed ones back the optional generation
 * layout: they take the generation counter as their single key, and build the effective key from
 * the generation prefix and the unprefixed key. They are only defined when `epoch` is enabled.
 */
export interface ExtendedRedis extends Redis {
	setMax(key: string, value: number): Promise<number>;
	release(key: string, value: string): Promise<number>;
	kvGetBuffer(epochKey: string, prefix: string, key: string): Promise<Buffer | null>;
	kvExists(epochKey: string, prefix: string, key: string): Promise<number>;
	kvDelete(epochKey: string, prefix: string, key: string): Promise<number>;

	kvSet(
		epochKey: string,
		seed: number,
		prefix: string,
		key: string,
		value: Buffer | number,
		ttl: number,
	): Promise<string | null>;

	kvIncrement(epochKey: string, seed: number, prefix: string, key: string, amount: number): Promise<number>;
	kvSetMax(epochKey: string, seed: number, prefix: string, key: string, value: number): Promise<number>;
	kvBumpEpoch(epochKey: string, seed: number): Promise<string>;
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
	 * Requested lock duration in miliseconds
	 */
	lockTimeout?: number;

	/**
	 * Existing or new Redis connection to use with this memory class
	 */
	redis: Redis | ExtendedRedis;

	/**
	 * Time-to-Live expires keys after duration in milliseconds
	 */
	ttl?: number;

	/**
	 * Keys are prefixed by an epoch (timestamp) improving clear operations by incrementing the epoch instead of manually removing all keys.
	 * To prevent redis exploding in memory, make sure that a TTL is set so that old keys can expire.
	 *
	 * @default false
	 */
	epoch?: boolean;
}

export type KvConfig = KvConfigLocal | KvConfigRedis;
