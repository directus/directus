import type { Kv } from '../../kv/index.js';
import { createKv } from '../../kv/index.js';
import type { Lock } from '../../kv/types/lock.js';
import type { CacheConfigRedis } from '../index.js';
import type { Cache } from '../types/class.js';

export class CacheRedis implements Cache {
	private store: Kv;

	constructor(config: Omit<CacheConfigRedis, 'type'>) {
		this.store = createKv({ type: 'redis', ...config });
	}

	async get<T = unknown>(key: string): Promise<T | undefined> {
		return await this.store.get<T>(key);
	}

	async set<T = unknown>(key: string, value: T): Promise<void> {
		return await this.store.set(key, value);
	}

	async delete(key: string): Promise<void> {
		return await this.store.delete(key);
	}

	async has(key: string): Promise<boolean> {
		return await this.store.has(key);
	}

	async clear(): Promise<void> {
		await this.store.clear();
	}

	async acquireLock(key: string): Promise<Lock> {
		return await this.store.acquireLock(key);
	}

	async usingLock<T>(key: string, callback: () => Promise<T>): Promise<T> {
		return await this.store.usingLock(key, callback);
	}
}
