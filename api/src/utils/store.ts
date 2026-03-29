import { type CacheConfig, createCache } from '@directus/memory';
import { redisConfigAvailable, useRedis } from '../redis/index.js';

export type RedisStore<T> = {
	has(key: keyof T): Promise<boolean>;
	get<K extends keyof T>(key: K): Promise<T[K]>;
	set<K extends keyof T>(key: K, value: T[K]): Promise<void>;
	delete(key: keyof T): Promise<void>;
};

export type StoreOptions<Type> = {
	defaults?: Partial<Type> | undefined;
	ttl?: number | undefined;
};

/**
 * Shared memory between multiple instances. Scoped to a provided namespace in redis.
 */
export function useStore<Type extends object>(namespace: string, options?: StoreOptions<Type>) {
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

	const store = createCache(config);

	return <T>(callback: (store: RedisStore<Type>) => Promise<T>) =>
		store.usingLock(`lock`, async () => {
			return await callback({
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
			});
		});
}
