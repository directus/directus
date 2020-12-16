import env from './env';
import Keyv, { Options } from 'keyv';
import { validateEnv } from './utils/validate-env';
import { getConfigFromEnv } from './utils/get-config-from-env';
import ms from 'ms';
import logger from './logger';

let cache: Keyv | null = null;

if (env.CACHE_ENABLED === true) {
	validateEnv(['CACHE_NAMESPACE', 'CACHE_TTL', 'CACHE_STORE']);
	cache = getKeyvInstance();
	cache.on('error', (err) => logger.error(err));
}

export default cache;

function getKeyvInstance() {
	switch (env.CACHE_STORE) {
		case 'redis':
			return new Keyv(getConfig('redis'));
		case 'memcache':
			return new Keyv(getConfig('memcache'));
		case 'memory':
		default:
			return new Keyv(getConfig());
	}
}

function getConfig(store: 'memory' | 'redis' | 'memcache' = 'memory'): Options<any> {
	const config: Options<any> = {
		namespace: env.CACHE_NAMESPACE,
		ttl: ms(env.CACHE_TTL as string),
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
