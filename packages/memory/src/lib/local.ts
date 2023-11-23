import { LRUCache } from 'lru-cache';
import type { Memory } from '../types/class.js';
import type { MemoryConfigLocal } from '../types/config.js';
import { deserialize, serialize } from '../utils/serialize.js';

export class MemoryLocal implements Memory {
	private cache: LRUCache<string, Uint8Array, unknown>;

	constructor(config: Omit<MemoryConfigLocal, 'type'>) {
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

	async increment(key: string, amount: number = 1) {
		const currentVal = await this.get(key) || 0;

		if (typeof currentVal !== 'number') {
			throw new Error(`The value for cache key "${key}" is not a number.`);
		}

		const newVal = currentVal + amount;

		await this.set(key, newVal);
	}
}
