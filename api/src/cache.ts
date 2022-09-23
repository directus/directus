import ms from 'ms';
import env from './env.js';
import { validateEnv } from './utils/validate-env.js';

import type { CacheOptions, CacheService } from './services/cache/cache.js';
import { RedisCache } from './services/cache/redis-cache.js';
import { MemCache } from './services/cache/mem-cache.js';
import {clearSystemCache} from './utils/clearSystemCache.js';

let cache: CacheService | null = null;
let systemCache: CacheService | null = null;
let lockCache: CacheService | null = null;

export function getCache(): { cache: CacheService | null; systemCache: CacheService; lockCache: CacheService } {
	if (env['CACHE_ENABLED'] === true && cache === null) {
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

function getCacheInstance(ttl: number | undefined, namespaceSuffix: string, checkLock: boolean = false): CacheService {
	const config: CacheOptions = {
		namespace: `${env['CACHE_NAMESPACE']}${namespaceSuffix}`,
		ttl,
		checkLock
	}

	switch (env['CACHE_STORE']) {
		case 'redis':
			return new RedisCache(config);
		case 'memory':
		default:
			return new MemCache(config);
	}
}