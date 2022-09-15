import { merge } from 'lodash-es';
import {
	IRateLimiterOptions,
	IRateLimiterStoreOptions,
	RateLimiterAbstract,
	RateLimiterMemory,
	RateLimiterRedis,
} from 'rate-limiter-flexible';
import env from './env.js';
import { getConfigFromEnv } from './utils/get-config-from-env.js';

type IRateLimiterOptionsOverrides = Partial<IRateLimiterOptions> | Partial<IRateLimiterStoreOptions>;

export function createRateLimiter(configOverrides?: IRateLimiterOptionsOverrides): RateLimiterAbstract {
	switch (env['RATE_LIMITER_STORE']) {
		case 'redis':
			return new RateLimiterRedis(getConfig('redis', configOverrides));
		case 'memory':
		default:
			return new RateLimiterMemory(getConfig('memory', configOverrides));
	}
}

function getConfig(store: 'memory', overrides?: IRateLimiterOptionsOverrides): IRateLimiterOptions;
function getConfig(store: 'redis', overrides?: IRateLimiterOptionsOverrides): IRateLimiterStoreOptions;
function getConfig(
	store: 'memory' | 'redis' = 'memory',
	overrides?: IRateLimiterOptionsOverrides
): IRateLimiterOptions | IRateLimiterStoreOptions {
	const config: any = getConfigFromEnv('RATE_LIMITER_', `RATE_LIMITER_${store}_`);

	if (store === 'redis') {
		const Redis = require('ioredis');
		delete config.redis;
		config.storeClient = new Redis(env['RATE_LIMITER_REDIS'] || getConfigFromEnv('RATE_LIMITER_REDIS_'));
	}

	delete config.enabled;
	delete config.store;

	merge(config, overrides || {});

	return config;
}
