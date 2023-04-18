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

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

type IRateLimiterOptionsOverrides = Partial<IRateLimiterOptions> | Partial<IRateLimiterStoreOptions>;

export function createRateLimiter(
	configPrefix = 'RATE_LIMITER',
	configOverrides?: IRateLimiterOptionsOverrides
): RateLimiterAbstract {
	switch (env['RATE_LIMITER_STORE']) {
		case 'redis':
			return new RateLimiterRedis(getRedisConfig(configPrefix, configOverrides));
		case 'memory':
		default:
			return new RateLimiterMemory(getMemoryConfig(configPrefix, configOverrides));
	}
}

function getMemoryConfig(configPrefix: string, overrides?: IRateLimiterOptionsOverrides): IRateLimiterOptions {
	const config: any = getConfigFromEnv(`${configPrefix}_`);

	delete config.enabled;
	delete config.store;
	merge(config, overrides ?? {});

	return config;
}
function getRedisConfig(configPrefix: string, overrides?: IRateLimiterOptionsOverrides): IRateLimiterStoreOptions {
	const config: any = merge(
		{},
		getConfigFromEnv('REDIS_'),
		getConfigFromEnv(`${configPrefix}_`, `${configPrefix}_REDIS_`)
	);

	const Redis = require('ioredis');
	config.storeClient = new Redis(env['RATE_LIMITER_REDIS'] ?? config);
	delete config.redis;

	delete config.enabled;
	delete config.store;

	merge(config, overrides ?? {});

	return config;
}
