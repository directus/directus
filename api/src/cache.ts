import Keyv, { Options } from 'keyv';
import ms from 'ms';
import env from './env';
import logger from './logger';
import { getConfigFromEnv } from './utils/get-config-from-env';
import { validateEnv } from './utils/validate-env';

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
		const KeyvAnyRedis = require('keyv-anyredis');
		const Redis = require('ioredis');
		if (env.CACHE_REDIS_CLUSTER === true) {
			const client = new Redis.Cluster(env.CACHE_REDIS || getConfigFromEnv('CACHE_REDIS_', 'CACHE_REDIS_CLUSTER'), {
				dnsLookup: (address: any, callback: (arg0: null, arg1: any) => any) => callback(null, address),
			});
			config.store = new KeyvAnyRedis(client);
		} else {
			const client = new Redis(env.CACHE_REDIS || getConfigFromEnv('CACHE_REDIS_'));
			config.store = new KeyvAnyRedis(client);
		}
	}

	if (store === 'memcache') {
		const KeyvMemcache = require('keyv-memcache');
		config.store = new KeyvMemcache(env.CACHE_MEMCACHE);
	}

	return config;
}
