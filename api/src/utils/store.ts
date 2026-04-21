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

export type WithLockOptions = {
	heartbeatMs?: number;
};

export class StoreLockedError extends Error {
	constructor(namespace: string) {
		super(`Resource "${namespace}" is already locked`);
		this.name = 'StoreLockedError';
	}
}

export type StoreFn<Type> = {
	<T>(callback: (store: RedisStore<Type>) => Promise<T>): Promise<T>;
	withLock<T>(state: Partial<Type>, callback: () => Promise<T>, options?: WithLockOptions): Promise<T>;
};

/**
 * Shared memory between instances, backed by Redis when available, local cache otherwise.
 *
 * @param namespace - Unique key used to scope the store (e.g. `directus:my-feature`)
 * @param options - Optional defaults and TTL (in ms)
 * @returns A callable to read/write values, plus `withLock` for long-running exclusive operations
 */
export function useStore<Type extends object>(namespace: string, options?: StoreOptions<Type>): StoreFn<Type> {
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

	if (config.type === 'redis' && options?.ttl) {
		config.ttl = options?.ttl;
	}

	const store = createCache(config);

	const storeFn = (<T>(callback: (store: RedisStore<Type>) => Promise<T>) =>
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
		})) as StoreFn<Type>;

	/**
	 * Run a callback with an exclusive lock on the given keys. A heartbeat refreshes the TTL during
	 * execution, so the lock survives long runs but expires on crash.
	 *
	 * @param state - Keys and values to write as the lock state
	 * @param callback - Work to run while the lock is held
	 * @param lockOptions - Optional heartbeat interval
	 * @throws {StoreLockedError} When any of the provided keys is already set
	 */
	storeFn.withLock = async <T>(
		state: Partial<Type>,
		callback: () => Promise<T>,
		lockOptions?: WithLockOptions,
	): Promise<T> => {
		const locked = await storeFn(async (s) => {
			for (const key of Object.keys(state) as (keyof Type)[]) {
				if (await s.get(key)) return true;
			}

			for (const [key, value] of Object.entries(state) as [keyof Type, Type[keyof Type]][]) {
				await s.set(key, value);
			}

			return false;
		});

		if (locked) {
			throw new StoreLockedError(namespace);
		}

		const interval = setInterval(() => {
			storeFn(async (s) => {
				for (const [key, value] of Object.entries(state) as [keyof Type, Type[keyof Type]][]) {
					await s.set(key, value);
				}
			}).catch(() => {});
		}, lockOptions?.heartbeatMs ?? 30_000);

		try {
			return await callback();
		} finally {
			clearInterval(interval);

			await storeFn(async (s) => {
				for (const key of Object.keys(state) as (keyof Type)[]) {
					await s.delete(key);
				}
			});
		}
	};

	return storeFn;
}
