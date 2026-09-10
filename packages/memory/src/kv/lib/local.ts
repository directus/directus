import { LRUCache } from 'lru-cache';
import { deserialize, serialize } from '../../utils/index.js';
import type { Kv } from '../types/class.js';
import type { KvConfigLocal } from '../types/config.js';

export class KvLocal implements Kv {
	private store: LRUCache<string, Uint8Array, unknown> | Map<string, Uint8Array>;

	constructor(config: Omit<KvConfigLocal, 'type'>) {
		// LRUCache requires maxKeys or ttl — fall back to Map when neither is set
		if (config.maxKeys || config.ttl) {
			const options: Record<string, unknown> = {};

			if (config.maxKeys) {
				options['max'] = config.maxKeys;
			}

			if (config.ttl) {
				options['ttl'] = config.ttl;
				// Enable automatic cleanup of expired entries (disabled by default)
				options['ttlAutopurge'] = true;
			}

			this.store = new LRUCache(options as any);
		} else {
			this.store = new Map();
		}
	}

	get<T = unknown>(key: string): T | undefined {
		const value = this.store.get(key);

		if (value !== undefined) {
			return deserialize<T>(value);
		}

		return undefined;
	}

	set(key: string, value: unknown): void {
		const serialized = serialize(value);
		this.store.set(key, serialized);
	}

	delete(key: string): void {
		this.store.delete(key);
	}

	has(key: string): boolean {
		return this.store.has(key);
	}

	increment(key: string, amount: number = 1): number {
		const currentVal = this.get(key) ?? 0;

		if (typeof currentVal !== 'number') {
			throw new Error(`The value for key "${key}" is not a number.`);
		}

		const newVal = currentVal + amount;

		this.set(key, newVal);

		return newVal;
	}

	setMax(key: string, value: number): boolean {
		const currentVal = this.get(key) ?? 0;

		if (typeof currentVal !== 'number') {
			throw new Error(`The value for key "${key}" is not a number.`);
		}

		if (currentVal >= value) {
			return false;
		}

		this.set(key, value);

		return true;
	}

	acquireLock(_key: string): {
		release: () => Promise<void>;
		extend: (_duration: number) => Promise<void>;
	} {
		return {
			release: async () => {},
			extend: async (_duration: number) => {},
		};
	}

	usingLock<T>(_key: string, callback: () => Promise<T>): Promise<T> {
		return callback();
	}

	clear(): void {
		this.store.clear();
	}
}
