import { type CacheConfig, createCache } from '@directus/memory';
import { redisConfigAvailable, useRedis } from '../redis/index.js';

export type RedisStore<T> = {
	has(key: keyof T): Promise<boolean>;
	get<K extends keyof T>(key: K): Promise<T[K]>;
	set<K extends keyof T>(key: K, value: T[K]): Promise<void>;
	delete(key: keyof T): Promise<void>;
};

export type StoreAccessor<Type extends object> = <T>(callback: (store: RedisStore<Type>) => Promise<T>) => Promise<T>;

export type Store<Type extends object> = StoreAccessor<Type> & {
	/**
	 * Access the store without acquiring the distributed lock.
	 *
	 * Only safe for callers that either don't rely on mutual exclusion, or that have exhausted
	 * their attempts to acquire the lock and prefer to continue over failing.
	 */
	unlocked: StoreAccessor<Type>;
};

export type StoreOptions<Type> = {
	defaults?: Partial<Type> | undefined;
	ttl?: number | undefined;
	/** Requested lock duration in milliseconds */
	lockTimeout?: number | undefined;
	/** Number of times acquiring the lock is retried before giving up */
	lockRetryCount?: number | undefined;
	/** Time in milliseconds to wait between attempts to acquire the lock */
	lockRetryDelay?: number | undefined;
};

/**
 * Shared memory between multiple instances. Scoped to a provided namespace in redis.
 */
export function useStore<Type extends object>(namespace: string, options?: StoreOptions<Type>): Store<Type> {
	const localOnly = redisConfigAvailable() === false;

	const config: CacheConfig = localOnly
		? {
				type: 'local',
			}
		: {
				type: 'redis',
				namespace,
				redis: useRedis(),
			};

	if (options?.ttl) {
		config.ttl = options?.ttl;
	}

	if (config.type === 'redis') {
		if (options?.lockTimeout) {
			config.lockTimeout = options.lockTimeout;
		}

		if (options?.lockRetryCount) {
			config.lockRetryCount = options.lockRetryCount;
		}

		if (options?.lockRetryDelay) {
			config.lockRetryDelay = options.lockRetryDelay;
		}
	}

	const store = createCache(config);

	const scopedStore: RedisStore<Type> = {
		has(key) {
			return store.has(String(key));
		},
		async get<K extends keyof Type>(key: K): Promise<Type[K]> {
			return ((await store.get(String(key))) ?? options?.defaults?.[key]) as Promise<Type[K]>;
		},
		set(key, value) {
			return store.set(String(key), value);
		},
		delete(key) {
			return store.delete(String(key));
		},
	};

	const useLockedStore: StoreAccessor<Type> = (callback) =>
		store.usingLock(`lock`, async () => {
			return await callback(scopedStore);
		});

	return Object.assign(useLockedStore, {
		unlocked: <T>(callback: (store: RedisStore<Type>) => Promise<T>) => callback(scopedStore),
	});
}
