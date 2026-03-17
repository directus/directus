import { type CacheConfig, createCache } from '@directus/memory';
import { redisConfigAvailable, useRedis } from '../redis/index.js';

export type RedisStore<T> = {
	has(key: keyof T): Promise<boolean>;
	get<K extends keyof T>(key: K): Promise<T[K]>;
	set<K extends keyof T>(key: K, value: T[K]): Promise<void>;
	delete(key: keyof T): Promise<void>;
};

/**
 * Shared memory between multiple instances. Scoped to a provided namespace in redis.
 */
export function useStore<Type extends object>(namespace: string, defaults?: Partial<Type>) {
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

	const store = createCache(config);

	return <T>(callback: (store: RedisStore<Type>) => Promise<T>) =>
		store.usingLock(`lock:${namespace}`, async () => {
			return await callback({
				has(key) {
					return store.has(`${namespace}:${String(key)}`);
				},
				async get<K extends keyof Type>(key: K): Promise<Type[K]> {
					return ((await store.get(`${namespace}:${String(key)}`)) ?? defaults?.[key]) as Promise<Type[K]>;
				},
				set(key, value) {
					return store.set(`${namespace}:${String(key)}`, value);
				},
				delete(key) {
					return store.delete(`${namespace}:${String(key)}`);
				},
			});
		});
}
