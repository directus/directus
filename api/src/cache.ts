import Keyv, { Options } from 'keyv';
import env from './env';
import logger from './logger';
import { compress, decompress } from './utils/compress';
import { getConfigFromEnv } from './utils/get-config-from-env';
import { getMilliseconds } from './utils/get-milliseconds';
import { validateEnv } from './utils/validate-env';
import { getMessenger } from './messenger';

let cache: Keyv | null = null;
let systemCache: Keyv | null = null;
let schemaCache: Keyv | null = null;
let lockCache: Keyv | null = null;
let messengerSubscribed = false;

type Store = 'memory' | 'redis' | 'memcache';

const messenger = getMessenger();

if (!messengerSubscribed) {
	messengerSubscribed = true;

	messenger.subscribe('schemaChanged', async (opts) => {
		if (env.CACHE_STORE === 'memory' && cache && env.CACHE_AUTO_PURGE && opts?.autoPurgeCache !== false) {
			await cache.clear();
		}

		await schemaCache?.clear();
	});
}

export function getCache(): { cache: Keyv | null; systemCache: Keyv; schemaCache: Keyv; lockCache: Keyv } {
	if (env.CACHE_ENABLED === true && cache === null) {
		validateEnv(['CACHE_NAMESPACE', 'CACHE_TTL', 'CACHE_STORE']);
		cache = getKeyvInstance(env.CACHE_STORE, getMilliseconds(env.CACHE_TTL));
		cache.on('error', (err) => logger.warn(err, `[cache] ${err}`));
	}

	if (systemCache === null) {
		systemCache = getKeyvInstance(env.CACHE_STORE, getMilliseconds(env.CACHE_SYSTEM_TTL), '_system');
		systemCache.on('error', (err) => logger.warn(err, `[cache] ${err}`));
	}

	if (schemaCache === null) {
		schemaCache = getKeyvInstance('memory', getMilliseconds(env.CACHE_SYSTEM_TTL), '_schema');
		schemaCache.on('error', (err) => logger.warn(err, `[cache] ${err}`));
	}

	if (lockCache === null) {
		lockCache = getKeyvInstance(env.CACHE_STORE, undefined, '_lock');
		lockCache.on('error', (err) => logger.warn(err, `[cache] ${err}`));
	}

	return { cache, systemCache, schemaCache, lockCache };
}

export async function flushCaches(forced?: boolean): Promise<void> {
	const { cache } = getCache();
	await clearSystemCache({ forced });
	await cache?.clear();
}

export async function clearSystemCache(opts?: { forced?: boolean; autoPurgeCache?: false }): Promise<void> {
	const { systemCache, schemaCache, lockCache } = getCache();

	// Flush system cache when forced or when system cache lock not set
	if (opts?.forced || !(await lockCache.get('system-cache-lock'))) {
		await lockCache.set('system-cache-lock', true, 10000);
		await schemaCache.clear();
		await systemCache.clear();
		await lockCache.delete('system-cache-lock');

		messenger.publish('schemaChanged', { autoPurgeCache: opts?.autoPurgeCache });
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

export async function setSchemaCache(value: any): Promise<void> {
	const { schemaCache, lockCache } = getCache();

	if (!(await lockCache.get('system-cache-lock'))) {
		await setCacheValue(schemaCache, 'schema', value);
	}
}

export async function getSchemaCache(): Promise<Record<string, any>> {
	const { schemaCache } = getCache();

	return await getCacheValue(schemaCache, 'schema');
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

function getKeyvInstance(store: Store, ttl: number | undefined, namespaceSuffix?: string): Keyv {
	switch (store) {
		case 'redis':
			return new Keyv(getConfig('redis', ttl, namespaceSuffix));
		case 'memcache':
			return new Keyv(getConfig('memcache', ttl, namespaceSuffix));
		case 'memory':
		default:
			return new Keyv(getConfig('memory', ttl, namespaceSuffix));
	}
}

function getConfig(store: Store = 'memory', ttl: number | undefined, namespaceSuffix = ''): Options<any> {
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
