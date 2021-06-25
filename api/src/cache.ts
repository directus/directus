import Keyv, { Options } from 'keyv';
import ms from 'ms';
import env from './env';
import logger from './logger';
import { getConfigFromEnv } from './utils/get-config-from-env';
import { validateEnv } from './utils/validate-env';

let cache: Keyv | null = null;
let schemaCache: Keyv | null = null;

export function getCache(): { cache: Keyv | null; schemaCache: Keyv | null } {
	if (env.CACHE_ENABLED === true && cache === null) {
		validateEnv(['CACHE_NAMESPACE', 'CACHE_TTL', 'CACHE_STORE']);
		cache = getKeyvInstance(ms(env.CACHE_TTL as string));
		cache.on('error', (err) => logger.error(err));
	}

	if (env.CACHE_SCHEMA !== false && schemaCache === null) {
		schemaCache = getKeyvInstance(typeof env.CACHE_SCHEMA === 'string' ? ms(env.CACHE_SCHEMA) : undefined);
		schemaCache.on('error', (err) => logger.error(err));
	}

	return { cache, schemaCache };
}

function getKeyvInstance(ttl: number | undefined): Keyv {
	switch (env.CACHE_STORE) {
		case 'redis':
			return new Keyv(getConfig('redis', ttl));
		case 'memcache':
			return new Keyv(getConfig('memcache', ttl));
		case 'memory':
		default:
			return new Keyv(getConfig('memory', ttl));
	}
}

function getConfig(store: 'memory' | 'redis' | 'memcache' = 'memory', ttl: number | undefined): Options<any> {
	const config: Options<any> = {
		namespace: env.CACHE_NAMESPACE,
		ttl,
	};

	if (store === 'redis') {
		const KeyvRedis = require('@keyv/redis');
		config.store = new KeyvRedis(env.CACHE_REDIS || getConfigFromEnv('CACHE_REDIS_'));
	}

	if (store === 'memcache') {
		const KeyvMemcache = require('keyv-memcache');
		config.store = new KeyvMemcache(env.CACHE_MEMCACHE);
	}

	return config;
}
