import { createCache, type CacheConfig } from '@directus/memory';
import { COLLAB } from '@directus/types';
import { redisConfigAvailable, useRedis } from '../../../redis/index.js';

export type RedisStore<T> = {
	has(key: keyof T): Promise<boolean>;
	get<K extends keyof T>(key: K): Promise<T[K]>;
	set<K extends keyof T>(key: K, value: T[K]): Promise<void>;
	delete(key: keyof T): Promise<void>;
};

const localOnly = redisConfigAvailable() === false;

const config: CacheConfig = localOnly
	? {
			type: 'local',
		}
	: {
			type: 'redis',
			namespace: COLLAB,
			redis: useRedis(),
		};

const store = createCache(config);

export function useStore<Type extends object>(uid: string) {
	return <T>(callback: (store: RedisStore<Type>) => Promise<T>) =>
		store.usingLock(`lock:${uid}`, async () => {
			return await callback({
				has(key) {
					return store.has(`${uid}:${String(key)}`);
				},
				get(key) {
					// No clue why TS doesn't pick up that this function can't return undefined
					return store.get(`${uid}:${String(key)}`) as any;
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
