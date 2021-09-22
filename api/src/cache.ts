import Keyv, { Options } from 'keyv';
import ms from 'ms';
import env from './env';
import logger from './logger';
import { getConfigFromEnv } from './utils/get-config-from-env';
import { validateEnv } from './utils/validate-env';
import { assign } from 'lodash';

let cache: Keyv | null = null;
let schemaCache: Keyv | null = null;

export function getCache(): { cache: Keyv | null; schemaCache: Keyv | null } {
	if (env.CACHE_ENABLED === true && cache === null) {
		validateEnv(['CACHE_NAMESPACE', 'CACHE_TTL', 'CACHE_STORE']);
		cache = getKeyvInstance(ms(env.CACHE_TTL as string));
		cache.on('error', (err) => logger.warn(err, `[cache] ${err}`));
	}

	if (env.CACHE_SCHEMA !== false && schemaCache === null) {
		schemaCache = getKeyvInstance(typeof env.CACHE_SCHEMA === 'string' ? ms(env.CACHE_SCHEMA) : undefined, '_schema');
		schemaCache.on('error', (err) => logger.warn(err, `[cache] ${err}`));
	}

	return { cache, schemaCache };
}

export async function flushCaches(): Promise<void> {
	const { schemaCache, cache } = getCache();
	await schemaCache?.clear();
	await cache?.clear();
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
		const KeyvAnyRedis = require('keyv-anyredis');
		const Redis = require('ioredis');
		if (env.CACHE_REDIS_CLUSTER === true) {
			const client = new Redis.Cluster(env.CACHE_REDIS || getConfigFromEnv('CACHE_REDIS_', 'CACHE_REDIS_CLUSTER'), {
				dnsLookup: (address: any, callback: (arg0: null, arg1: any) => any) => callback(null, address),
			});
			config.store = new KeyvAnyRedis(client);
		} else {
			const client = new Redis(env.CACHE_REDIS || assign({ commandTimeout: 500 }, getConfigFromEnv('CACHE_REDIS_')));
			config.store = new KeyvAnyRedis(client);
		}
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
