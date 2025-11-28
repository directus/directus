import type { Kv } from '../../kv/index.js';
import { createKv } from '../../kv/index.js';
import type { CacheConfigRedis } from '../index.js';
import type { Cache } from '../types/class.js';

export class CacheRedis implements Cache {
	private store: Kv;

	constructor(config: Omit<CacheConfigRedis, 'type'>) {
		this.store = createKv({ type: 'redis', ...config });
	}

	async get<T = unknown>(key: string) {
		return await this.store.get<T>(key);
	}

	async set<T = unknown>(key: string, value: T) {
		return await this.store.set(key, value);
	}

	async delete(key: string) {
		return await this.store.delete(key);
	}

	async has(key: string) {
		return await this.store.has(key);
	}

	async clear(): Promise<void> {
		await this.store.clear();
	}

	async aquireLock(key: string) {
		return await this.store.aquireLock(key);
	}

	async releaseLock(key: string, hash: string) {
		return await this.store.releaseLock(key, hash);
	}
}
