import ms from 'ms';
import env from './env';
import { validateEnv } from './utils/validate-env.js';
import { compress, decompress } from './utils/compress.js';
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
		await setCacheValue(systemCache, key, value, ttl);
	}
}

export async function getSystemCache(key: string): Promise<Record<string, any>> {
	const { systemCache } = getCache();

	return await getCacheValue(systemCache, key);
}

export async function setCacheValue(
	cache: CacheService,
	key: string,
	value: Record<string, any> | Record<string, any>[],
	ttl?: number
) {
	const compressed = await compress(value);
	await cache.set(key, compressed, ttl);
}

export async function getCacheValue(cache: CacheService, key: string): Promise<any> {
	const value = await cache.get(key);
	if (!value) return undefined;
	const decompressed = await decompress(value);
	return decompressed;
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