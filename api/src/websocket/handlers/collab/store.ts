import { createCache, type CacheConfig } from '@directus/memory';
import { COLLAB } from '@directus/types';
import { redisConfigAvailable, useRedis } from '../../../redis/index.js';
import { RedisStoreError } from './errors.js';

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
	return async function access<T>(callback: (store: RedisStore<Type>) => Promise<T>): Promise<T> {
		let lock = await store.aquireLock(`lock:${uid}`);
		let tries = 0;

		while (!lock) {
			tries++;

			if (tries > 5) {
				throw new RedisStoreError(`Couldn't aquire lock ${uid}`);
			}

			await sleep(200 * tries + Math.random() * 200);
			lock = await store.aquireLock(`lock:${uid}`);
		}

		const result = await callback({
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

		await store.releaseLock(`lock:${uid}`, lock);

		return result;
	};
}

const sleep = (time: number) =>
	new Promise((resolve) => {
		setTimeout(resolve, time);
	});
