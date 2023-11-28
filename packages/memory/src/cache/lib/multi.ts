import type { Cache } from '../types/class.js';
import type { CacheConfigMulti } from '../types/config.js';
import { CacheLocal } from './local.js';
import { CacheRedis } from './redis.js';

/**
 * Redis is considered the shared source of truth. For methods like has, increment, or setMax, the
 * Redis value is used, and the local value is synced to the Redis value if needed
 */
export class CacheMulti implements Cache {
	local: CacheLocal;
	redis: CacheRedis;

	constructor(config: Omit<CacheConfigMulti, 'type'>) {
		this.local = new CacheLocal(config.local);
		this.redis = new CacheRedis(config.redis);
	}

	async get<T = unknown>(key: string) {
		const local = await this.local.get<T>(key);

		if (local !== undefined) {
			return local;
		}

		return await this.redis.get<T>(key);
	}

	async set(key: string, value: unknown) {
		await Promise.all([this.local.set(key, value), this.redis.set(key, value)]);
	}

	async delete(key: string) {
		await Promise.all([this.local.delete(key), this.redis.delete(key)]);
	}

	async has(key: string) {
		return await this.redis.has(key);
	}

	async increment(key: string, amount: number = 1) {
		const value = await this.redis.increment(key, amount);
		await this.local.set(key, value);
		return value;
	}

	async setMax(key: string, value: number) {
		const wasSet = await this.redis.setMax(key, value);

		if (wasSet) {
			this.local.set(key, value);
		}

		return wasSet;
	}
}
