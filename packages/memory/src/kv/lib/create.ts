import type { KvConfig } from '../types/config.js';
import { KvLocal } from './local.js';
import { KvRedis } from './redis.js';

export const createKv = (config: KvConfig) => {
	if (config.type === 'local') {
		return new KvLocal(config);
	}

	if (config.type === 'redis') {
		return new KvRedis(config);
	}

	throw new Error(`Invalid KV configuration: Type does not exist.`);
};
