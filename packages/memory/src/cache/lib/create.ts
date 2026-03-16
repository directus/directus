import type { CacheConfig } from '../types/config.js';
import { CacheLocal } from './local.js';
import { CacheMulti } from './multi.js';
import { CacheRedis } from './redis.js';

export const createCache = (config: CacheConfig): CacheLocal | CacheRedis | CacheMulti => {
	if (config.type === 'local') {
		return new CacheLocal(config);
	}

	if (config.type === 'redis') {
		return new CacheRedis(config);
	}

	if (config.type === 'multi') {
		return new CacheMulti(config);
	}

	throw new Error(`Invalid Cache configuration: Type does not exist.`);
};
