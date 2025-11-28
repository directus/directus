import { processId } from '@directus/utils/node';
import { createBus, type Bus } from '../../bus/index.js';
import type { Cache } from '../types/class.js';
import type { CacheConfigMulti } from '../types/config.js';
import { CacheLocal } from './local.js';
import { CacheRedis } from './redis.js';

export const CACHE_CHANNEL_KEY = 'multi-cache';

export type CacheMultiMessageClear = {
	type: 'clear';

	/** Process this message came from */
	origin: string;

	/**
	 * Key to clear from the local memory
	 * Will clear all keys when left undefined
	 */
	key?: string;
};

export class CacheMulti implements Cache {
	processId = processId();

	local: CacheLocal;
	redis: CacheRedis;
	bus: Bus;

	constructor(config: Omit<CacheConfigMulti, 'type'>) {
		this.local = new CacheLocal(config.local);
		this.redis = new CacheRedis(config.redis);
		this.bus = createBus({ type: 'redis', redis: config.redis.redis, namespace: config.redis.namespace });

		// Explicitly wrap the function in a lambda to preserve the `this` context
		this.bus.subscribe<CacheMultiMessageClear>(CACHE_CHANNEL_KEY, (payload) => this.onMessageClear(payload));
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
		await this.clearOthers(key);
	}

	async delete(key: string) {
		await Promise.all([this.local.delete(key), this.redis.delete(key)]);
		await this.clearOthers(key);
	}

	async has(key: string) {
		// TODO: should this check local first?
		return await this.redis.has(key);
	}

	private async clearOthers(key?: string) {
		await this.bus.publish(CACHE_CHANNEL_KEY, {
			type: 'clear',
			key: key,
			origin: this.processId,
		});
	}

	async clear(): Promise<void> {
		await Promise.all([this.local.clear(), this.redis.clear()]);
		await this.clearOthers();
	}

	async aquireLock(key: string) {
		return await this.redis.aquireLock(key);
	}

	async releaseLock(key: string, hash: string) {
		return await this.redis.releaseLock(key, hash);
	}

	private async onMessageClear(payload: CacheMultiMessageClear) {
		// Ignore messages that were sent by the current process. The message is sent in the set and
		// delete methods; we don't need to delete keys that are already up-to-date / already deleted
		if (payload.origin === this.processId) return;

		if (payload.key !== undefined) {
			await this.local.delete(payload.key);
		} else {
			await this.local.clear();
		}
	}
}
