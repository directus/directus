import { LRUCache } from 'lru-cache';
import { deserialize, serialize } from '../../utils/index.js';
import type { Kv } from '../types/class.js';
import type { KvConfigLocal } from '../types/config.js';
import { Lock, type RedlockAbortSignal, type RedlockUsingContext } from '@sesamecare-oss/redlock';

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

	async get<T = unknown>(key: string) {
		const value = this.store.get(key);

		if (value !== undefined) {
			return deserialize<T>(value);
		}

		return undefined;
	}

	async set(key: string, value: unknown) {
		const serialized = serialize(value);
		this.store.set(key, serialized);
	}

	async delete(key: string) {
		this.store.delete(key);
	}

	async has(key: string) {
		return this.store.has(key);
	}

	async increment(key: string, amount: number = 1) {
		const currentVal = (await this.get(key)) ?? 0;

		if (typeof currentVal !== 'number') {
			throw new Error(`The value for key "${key}" is not a number.`);
		}

		const newVal = currentVal + amount;

		await this.set(key, newVal);

		return newVal;
	}

	async setMax(key: string, value: number) {
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

	async aquireLock(_key: string) {
		return {
			release: async () => {},
			extend: async (_duration: number) => {},
		};
	}

	async usingLock<T>(_key: string, callback: () => Promise<T>): Promise<T> {
		return callback();
	}

	async clear() {
		this.store.clear();
	}
}
