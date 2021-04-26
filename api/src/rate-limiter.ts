import {
	RateLimiterMemory,
	RateLimiterRedis,
	RateLimiterMemcache,
	IRateLimiterOptions,
	IRateLimiterStoreOptions,
} from 'rate-limiter-flexible';

import { merge } from 'lodash';

import env from './env';
import { getConfigFromEnv } from './utils/get-config-from-env';

type IRateLimiterOptionsOverrides = Partial<IRateLimiterOptions> | Partial<IRateLimiterStoreOptions>;

export function createRateLimiter(configOverrides?: IRateLimiterOptionsOverrides) {
	switch (env.RATE_LIMITER_STORE) {
		case 'redis':
			return new RateLimiterRedis(getConfig('redis', configOverrides));
		case 'memcache':
			return new RateLimiterMemcache(getConfig('memcache', configOverrides));
		case 'memory':
		default:
			return new RateLimiterMemory(getConfig('memory', configOverrides));
	}
}

function getConfig(store: 'memory', overrides?: IRateLimiterOptionsOverrides): IRateLimiterOptions;
function getConfig(store: 'redis' | 'memcache', overrides?: IRateLimiterOptionsOverrides): IRateLimiterStoreOptions;
function getConfig(
	store: 'memory' | 'redis' | 'memcache' = 'memory',
	overrides?: IRateLimiterOptionsOverrides
): IRateLimiterOptions | IRateLimiterStoreOptions {
	const config: any = getConfigFromEnv('RATE_LIMITER_', `RATE_LIMITER_${store}_`);

	if (store === 'redis') {
		const Redis = require('ioredis');
		delete config.redis;
		config.storeClient = new Redis(env.RATE_LIMITER_REDIS || getConfigFromEnv('RATE_LIMITER_REDIS_'));
	}

	if (store === 'memcache') {
		const Memcached = require('memcached');
		config.storeClient = new Memcached(env.RATE_LIMITER_MEMCACHE, getConfigFromEnv('RATE_LIMITER_MEMCACHE_'));
	}

	delete config.enabled;
	delete config.store;

	merge(config, overrides || {});

	return config;
}
