import { merge } from 'lodash';
import {
	IRateLimiterOptions,
	IRateLimiterStoreOptions,
	RateLimiterAbstract,
	RateLimiterMemcache,
	RateLimiterMemory,
	RateLimiterRedis,
} from 'rate-limiter-flexible';
import env from './env';
import { getConfigFromEnv } from './utils/get-config-from-env';

type IRateLimiterOptionsOverrides = Partial<IRateLimiterOptions> | Partial<IRateLimiterStoreOptions>;

export function createRateLimiter(
	envKey = 'RATE_LIMITER',
	configOverrides?: IRateLimiterOptionsOverrides
): RateLimiterAbstract {
	switch (env.RATE_LIMITER_STORE) {
		case 'redis':
			return new RateLimiterRedis(getConfig('redis', envKey, configOverrides));
		case 'memcache':
			return new RateLimiterMemcache(getConfig('memcache', envKey, configOverrides));
		case 'memory':
		default:
			return new RateLimiterMemory(getConfig('memory', envKey, configOverrides));
	}
}

function getConfig(store: 'memory', envKey: string, overrides?: IRateLimiterOptionsOverrides): IRateLimiterOptions;
function getConfig(
	store: 'redis' | 'memcache',
	envKey: string,
	overrides?: IRateLimiterOptionsOverrides
): IRateLimiterStoreOptions;
function getConfig(
	store: 'memory' | 'redis' | 'memcache' = 'memory',
	envKey = 'RATE_LIMITER',
	overrides?: IRateLimiterOptionsOverrides
): IRateLimiterOptions | IRateLimiterStoreOptions {
	const config: any = getConfigFromEnv(`${envKey}_`, `${envKey}_${store}_`);

	if (store === 'redis') {
		const Redis = require('ioredis');
		delete config.redis;
		config.storeClient = new Redis(env[`${envKey}_REDIS`] || getConfigFromEnv(`${envKey}_REDIS_`));
	}

	if (store === 'memcache') {
		const Memcached = require('memcached');
		config.storeClient = new Memcached(env[`${envKey}_MEMCACHE`], getConfigFromEnv(`${envKey}_MEMCACHE_`));
	}

	delete config.enabled;
	delete config.store;

	merge(config, overrides || {});

	return config;
}
