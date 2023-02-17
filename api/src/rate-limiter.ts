import { merge } from 'lodash';
import {
	IRateLimiterOptions,
	IRateLimiterStoreOptions,
	RateLimiterAbstract,
	RateLimiterMemory,
	RateLimiterRedis,
} from 'rate-limiter-flexible';
import env from './env';
import { getConfigFromEnv } from './utils/get-config-from-env';

type IRateLimiterOptionsOverrides = Partial<IRateLimiterOptions> | Partial<IRateLimiterStoreOptions>;

export function createRateLimiter(configOverrides?: IRateLimiterOptionsOverrides): RateLimiterAbstract {
	switch (env.RATE_LIMITER_STORE) {
		case 'redis':
			return new RateLimiterRedis(getRedisConfig(configOverrides));
		case 'memory':
		default:
			return new RateLimiterMemory(getMemoryConfig(configOverrides));
	}
}

function getMemoryConfig(overrides?: IRateLimiterOptionsOverrides): IRateLimiterOptions {
	const config: any = getConfigFromEnv('RATE_LIMITER_', `RATE_LIMITER_MEMORY_`);

	delete config.enabled;
	delete config.store;
	merge(config, overrides || {});

	return config;
}
function getRedisConfig(overrides?: IRateLimiterOptionsOverrides): IRateLimiterStoreOptions {
	const config: any = merge({}, getConfigFromEnv('REDIS_'), getConfigFromEnv('RATE_LIMITER_', `RATE_LIMITER_REDIS_`));

	const Redis = require('ioredis');
	delete config.redis;

	config.storeClient = new Redis(env.RATE_LIMITER_REDIS || config);

	delete config.enabled;
	delete config.store;

	merge(config, overrides || {});

	return config;
}
