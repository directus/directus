import { LRUCache } from 'lru-cache';
import { deserialize, serialize } from '../../utils/index.js';
import type { Kv } from '../types/class.js';
import type { KvConfigLocal } from '../types/config.js';

export class KvLocal implements Kv {
	private store: LRUCache<string, Uint8Array, unknown> | Map<string, Uint8Array>;

	constructor(config: Omit<KvConfigLocal, 'type'>) {
		if ('maxKeys' in config) {
			this.store = new LRUCache({
				max: config.maxKeys,
			});
		} else {
			this.store = new Map();
		}
	}

	async get<T = unknown>(key: string): Promise<T | undefined> {
		const value = this.store.get(key);

		if (value !== undefined) {
			return deserialize<T>(value);
		}

		return undefined;
	}

	async set(key: string, value: unknown): Promise<void> {
		const serialized = serialize(value);
		this.store.set(key, serialized);
	}

	async delete(key: string): Promise<void> {
		this.store.delete(key);
	}

	async has(key: string): Promise<boolean> {
		return this.store.has(key);
	}

	async increment(key: string, amount: number = 1): Promise<number> {
		const currentVal = (await this.get(key)) ?? 0;

		if (typeof currentVal !== 'number') {
			throw new Error(`The value for key "${key}" is not a number.`);
		}

		const newVal = currentVal + amount;

		await this.set(key, newVal);

		return newVal;
	}

	async setMax(key: string, value: number): Promise<boolean> {
		const currentVal = (await this.get(key)) ?? 0;

		if (typeof currentVal !== 'number') {
			throw new Error(`The value for key "${key}" is not a number.`);
		}

		if (currentVal > value) {
			return false;
		}

		await this.set(key, value);

		return true;
	}

	async acquireLock(_key: string): Promise<{
		release: () => Promise<void>;
		extend: (_duration: number) => Promise<void>;
	}> {
		return {
			release: async () => {},
			extend: async (_duration: number) => {},
		};
	}

	async usingLock<T>(_key: string, callback: () => Promise<T>): Promise<T> {
		return callback();
	}

	async clear(): Promise<void> {
		this.store.clear();
	}
}
