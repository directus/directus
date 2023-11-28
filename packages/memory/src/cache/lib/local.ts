import { LRUCache } from 'lru-cache';
import { deserialize, serialize } from '../../utils/index.js';
import type { Cache } from '../types/class.js';
import type { CacheConfigLocal } from '../types/config.js';

export class CacheLocal implements Cache {
	private cache: LRUCache<string, Uint8Array, unknown>;

	constructor(config: Omit<CacheConfigLocal, 'type'>) {
		this.cache = new LRUCache({
			max: config.maxKeys,
		});
	}

	async get<T = unknown>(key: string) {
		const cached = this.cache.get(key);

		if (cached !== undefined) {
			return deserialize<T>(cached);
		}

		return undefined;
	}

	async set(key: string, value: unknown) {
		const serialized = serialize(value);
		this.cache.set(key, serialized);
	}

	async delete(key: string) {
		this.cache.delete(key);
	}

	async has(key: string) {
		return this.cache.has(key);
	}

	async increment(key: string, amount: number = 1) {
		const currentVal = (await this.get(key)) ?? 0;

		if (typeof currentVal !== 'number') {
			throw new Error(`The value for cache key "${key}" is not a number.`);
		}

		const newVal = currentVal + amount;

		await this.set(key, newVal);

		return newVal;
	}

	async setMax(key: string, value: number) {
		const currentVal = (await this.get(key)) ?? 0;

		if (typeof currentVal !== 'number') {
			throw new Error(`The value for cache key "${key}" is not a number.`);
		}

		if (currentVal > value) {
			return false;
		}

		await this.set(key, value);

		return true;
	}
}
