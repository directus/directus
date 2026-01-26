import { useEnv } from '@directus/env';
import { type CacheConfig, defineCache } from '@directus/memory';
import { redisConfigAvailable, useRedis } from '../redis/index.js';
import { getMilliseconds } from '../utils/get-milliseconds.js';

const localOnly = redisConfigAvailable() === false;
const env = useEnv();
const ttl = getMilliseconds(env['CACHE_SYSTEM_TTL']);

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
				...(ttl !== undefined ? { ttl } : {}),
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
