import ms from 'ms';
import env from './env.js';
import { validateEnv } from './utils/validate-env.js';

import type { CacheOptions, CacheService } from './services/cache/cache.js';
import { RedisCache } from './services/cache/redis-cache.js';
import { MemCache } from './services/cache/mem-cache.js';

let cache: CacheService | null = null;
let systemCache: CacheService | null = null;
let lockCache: CacheService | null = null;

export function getCache(): { cache: CacheService | null; systemCache: CacheService; lockCache: CacheService } {
	if (env['CACHE_ENABLED'] === true && cache === null) {
		validateEnv(['CACHE_NAMESPACE', 'CACHE_TTL', 'CACHE_STORE']);
		cache = getCacheInstance(env['CACHE_TTL'] ? ms(env['CACHE_TTL']) : undefined);
	}

	if (systemCache === null) {
		systemCache = getCacheInstance(env['CACHE_SYSTEM_TTL'] ? ms(env['CACHE_SYSTEM_TTL']) : undefined, '_system');
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

export async function clearSystemCache(forced?: boolean): Promise<void> {
	const { systemCache, lockCache } = getCache();

	// Flush system cache when forced or when system cache lock not set
	if (forced || !(await lockCache.get('system-cache-lock'))) {
		await lockCache.set('system-cache-lock', true, 10000);
		await systemCache.clear();
		await lockCache.delete('system-cache-lock');
	}
}

export async function setSystemCache(key: string, value: any, ttl?: number): Promise<void> {
	const { systemCache, lockCache } = getCache();

	if (!(await lockCache.get('system-cache-lock'))) {
		await systemCache.set(key, value, ttl);
	}
}

export async function getSystemCache(key: string): Promise<Record<string, any>> {
	const { systemCache } = getCache();

	return await systemCache.get(key);
}

function getCacheInstance(ttl: number | undefined, namespaceSuffix?: string): CacheService {
	const config: CacheOptions = {
		namespace: `${env['CACHE_NAMESPACE']}${namespaceSuffix}`,
		ttl,
	}

	switch (env['CACHE_STORE']) {
		case 'redis':
			return new RedisCache(config);
		case 'memory':
		default:
			return new MemCache(config);
	}
}