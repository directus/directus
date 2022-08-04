import Keyv, { Options } from 'keyv';
import ms from 'ms';
import env from './env';
import logger from './logger';
import { getConfigFromEnv } from './utils/get-config-from-env';
import { validateEnv } from './utils/validate-env';
import { compress, decompress } from './utils/compress';

let cache: Keyv | null = null;
let systemCache: Keyv | null = null;
let lockCache: Keyv | null = null;

export function getCache(): { cache: Keyv | null; systemCache: Keyv; lockCache: Keyv } {
	if (env.CACHE_ENABLED === true && cache === null) {
		validateEnv(['CACHE_NAMESPACE', 'CACHE_TTL', 'CACHE_STORE']);
		cache = getKeyvInstance(env.CACHE_TTL ? ms(env.CACHE_TTL as string) : undefined);
		cache.on('error', (err) => logger.warn(err, `[cache] ${err}`));
	}

	if (systemCache === null) {
		systemCache = getKeyvInstance(env.CACHE_SYSTEM_TTL ? ms(env.CACHE_SYSTEM_TTL as string) : undefined, '_system');
		systemCache.on('error', (err) => logger.warn(err, `[cache] ${err}`));
	}

	if (lockCache === null) {
		lockCache = getKeyvInstance(undefined, '_lock');
		lockCache.on('error', (err) => logger.warn(err, `[cache] ${err}`));
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
	cache: Keyv,
	key: string,
	value: Record<string, any> | Record<string, any>[],
	ttl?: number
) {
	const compressed = await compress(value);
	await cache.set(key, compressed, ttl);
}

export async function getCacheValue(cache: Keyv, key: string): Promise<any> {
	const value = await cache.get(key);
	if (!value) return undefined;
	const decompressed = await decompress(value);
	return decompressed;
}

function getKeyvInstance(ttl: number | undefined, namespaceSuffix?: string): Keyv {
	switch (env.CACHE_STORE) {
		case 'redis':
			return new Keyv(getConfig('redis', ttl, namespaceSuffix));
		case 'memcache':
			return new Keyv(getConfig('memcache', ttl, namespaceSuffix));
		case 'memory':
		default:
			return new Keyv(getConfig('memory', ttl, namespaceSuffix));
	}
}

function getConfig(
	store: 'memory' | 'redis' | 'memcache' = 'memory',
	ttl: number | undefined,
	namespaceSuffix = ''
): Options<any> {
	const config: Options<any> = {
		namespace: `${env.CACHE_NAMESPACE}${namespaceSuffix}`,
		ttl,
	};

	if (store === 'redis') {
		const KeyvRedis = require('@keyv/redis');

		config.store = new KeyvRedis(env.CACHE_REDIS || getConfigFromEnv('CACHE_REDIS_'));
	}

	if (store === 'memcache') {
		const KeyvMemcache = require('keyv-memcache');

		// keyv-memcache uses memjs which only accepts a comma separated string instead of an array,
		// so we need to join array into a string when applicable. See #7986
		const cacheMemcache = Array.isArray(env.CACHE_MEMCACHE) ? env.CACHE_MEMCACHE.join(',') : env.CACHE_MEMCACHE;

		config.store = new KeyvMemcache(cacheMemcache);
	}

	return config;
}
