import { useEnv } from '@directus/env';
import { type CacheConfig, createCache } from '@directus/memory';
import { redisConfigAvailable, useRedis } from '../../redis/index.js';

export type RedisStore<T> = {
	has(key: keyof T): Promise<boolean>;
	get<K extends keyof T>(key: K): Promise<T[K]>;
	set<K extends keyof T>(key: K, value: T[K]): Promise<void>;
	delete(key: keyof T): Promise<void>;
};

const env = useEnv();

const localOnly = redisConfigAvailable() === false;

const config: CacheConfig = localOnly
	? {
			type: 'local',
		}
	: {
			type: 'redis',
			namespace: (env['WEBSOCKETS_COLLAB_STORE_NAMESPACE'] as string) ?? 'collab',
			redis: useRedis(),
		};

const store = createCache(config);

export function useStore<Type extends object>(uid: string, defaults?: Partial<Type>) {
	return <T>(callback: (store: RedisStore<Type>) => Promise<T>) =>
		store.usingLock(`lock:${uid}`, async () => {
			return await callback({
				has(key) {
					return store.has(`${uid}:${String(key)}`);
				},
				async get<K extends keyof Type>(key: K): Promise<Type[K]> {
					return ((await store.get(`${uid}:${String(key)}`)) ?? defaults?.[key]) as Promise<Type[K]>;
				},
				set(key, value) {
					return store.set(`${uid}:${String(key)}`, value);
				},
				delete(key) {
					return store.delete(`${uid}:${String(key)}`);
				},
			});
		});
}
