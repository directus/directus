import ms from 'ms';
import env from './env';
import logger from './logger';
import { getConfigFromEnv } from './utils/get-config-from-env';
import { validateEnv } from './utils/validate-env';

import type { CacheOptions, CacheService } from './services/cache/cache';
import { RedisCache } from './services/cache/redis-cache';
import { MemCache } from './services/cache/mem-cache';
import { clearSystemCache } from './utils/clearSystemCache';

let cache: CacheService | null = null;
let systemCache: CacheService | null = null;
let lockCache: CacheService | null = null;

export function getCache(): { cache: CacheService | null; systemCache: CacheService; lockCache: CacheService } {
	if (env.CACHE_ENABLED === true && cache === null) {
		validateEnv(['CACHE_NAMESPACE', 'CACHE_TTL', 'CACHE_STORE']);
		cache = getCacheInstance(env['CACHE_TTL'] ? ms(env['CACHE_TTL']) : undefined, '_data');
	}

	if (systemCache === null) {
		systemCache = getCacheInstance(env['CACHE_SYSTEM_TTL'] ? ms(env['CACHE_SYSTEM_TTL']) : undefined, '_system', true);
	}

	if (lockCache === null) {
		lockCache = getCacheInstance(undefined, '_lock');
	}

	return { cache, systemCache, lockCache };
}

export async function flushCaches(forced?: boolean): Promise<void> {
	const { cache } = getCache();
	await clearSystemCache(forced);
	await cache?.clear();
}

function getCacheInstance(ttl: number | undefined, namespaceSuffix: string, checkLock = false): CacheService {
	const config: CacheOptions = {
		namespace: `${env['CACHE_NAMESPACE']}${namespaceSuffix}`,
		ttl,
		checkLock,
	};

	if (store === 'redis') {
		config.store = new KeyvRedis(env['CACHE_REDIS'] || getConfigFromEnv('CACHE_REDIS_')) as any;
	}

	if (store === 'memcache') {
		// keyv-memcache uses memjs which only accepts a comma separated string instead of an array,
		// so we need to join array into a string when applicable. See #7986
		const cacheMemcache = Array.isArray(env['CACHE_MEMCACHE'])
			? env['CACHE_MEMCACHE'].join(',')
			: env['CACHE_MEMCACHE'];

		config.store = new KeyvMemcache(cacheMemcache) as any;
	}

	return config;
}
