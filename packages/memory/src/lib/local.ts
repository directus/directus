import { LRUCache } from 'lru-cache';
import type { Memory, MessageHandler } from '../types/class.js';
import type { MemoryConfigLocal } from '../types/config.js';
import { deserialize, serialize } from '../utils/serialize.js';

export class MemoryLocal implements Memory {
	private cache: LRUCache<string, Uint8Array, unknown>;
	private handlers: Record<string, Set<MessageHandler>>;

	constructor(config: Omit<MemoryConfigLocal, 'type'>) {
		this.cache = new LRUCache({
			max: config.maxKeys,
		});

		this.handlers = {};
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
		const currentVal = (await this.get(key)) ?? 0;

		if (typeof currentVal !== 'number') {
			throw new Error(`The value for cache key "${key}" is not a number.`);
		}

		const newVal = currentVal + amount;

		await this.set(key, newVal);
	}

	async delete(key: string) {
		this.cache.delete(key);
	}

	async publish<T = unknown>(channel: string, payload: T) {
		this.handlers[channel]?.forEach((callback) => callback(payload));
	}

	async subscribe(channel: string, callback: MessageHandler) {
		const set = this.handlers[channel] ?? new Set();

		set.add(callback);

		this.handlers[channel] = set;
	}

	async unsubscribe(channel: string, callback: MessageHandler) {
		this.handlers[channel]?.delete(callback);
	}
}
