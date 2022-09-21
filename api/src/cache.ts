import ms from 'ms';
import env from './env.js';
import logger from './logger.js';
import { getConfigFromEnv } from './utils/get-config-from-env.js';
import { validateEnv } from './utils/validate-env.js';
import { compress, decompress } from './utils/compress.js';
import KeyvMemcache from 'keyv-memcache';
import KeyvRedis from '@keyv/redis';

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
