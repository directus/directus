import { defineCache, type CacheConfig } from '@directus/memory';
import { redisConfigAvailable, useRedis } from '../redis/index.js';

const localOnly = redisConfigAvailable() === false;

const config: CacheConfig = localOnly
	? {
			type: 'local',
			maxKeys: 500,
		}
	: {
			type: 'multi',
			redis: {
				namespace: 'permissions',
				redis: useRedis(),
			},
			local: {
				maxKeys: 100,
			},
		};

export const useCache = defineCache(config);

export function clearCache() {
	const cache = useCache();
	return cache.clear();
}
