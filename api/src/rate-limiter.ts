import { getConfigFromEnv } from './utils/get-config-from-env.js';
import { useEnv } from '@directus/env';
import { merge } from 'lodash-es';
import { createRequire } from 'node:module';
import type { IRateLimiterOptions, IRateLimiterStoreOptions, RateLimiterAbstract } from 'rate-limiter-flexible';
import { RateLimiterMemory, RateLimiterRedis, RateLimiterRes } from 'rate-limiter-flexible';


const require = createRequire(import.meta.url);

type IRateLimiterOptionsOverrides = Partial<IRateLimiterOptions> | Partial<IRateLimiterStoreOptions>;

export function createRateLimiter(
	configPrefix = 'RATE_LIMITER',
	configOverrides?: IRateLimiterOptionsOverrides,
): RateLimiterAbstract {
	const env = useEnv();

	switch (env['RATE_LIMITER_STORE']) {
		case 'redis':
			return new RateLimiterRedis(getConfig('redis', configPrefix, configOverrides));
		case 'memory':
		default:
			return new RateLimiterMemory(getConfig('memory', configPrefix, configOverrides));
	}
}

export { RateLimiterRes };

function getConfig(
	store: 'memory',
	configPrefix: string,
	overrides?: IRateLimiterOptionsOverrides,
): IRateLimiterOptions;
function getConfig(
	store: 'redis',
	configPrefix: string,
	overrides?: IRateLimiterOptionsOverrides,
): IRateLimiterStoreOptions;
function getConfig(
	store: 'memory' | 'redis' = 'memory',
	configPrefix = 'RATE_LIMITER',
	overrides?: IRateLimiterOptionsOverrides,
): IRateLimiterOptions | IRateLimiterStoreOptions {
	const config: any = getConfigFromEnv(`${configPrefix}_`, { omitPrefix: `${configPrefix}_${store}_` });

	if (store === 'redis') {
		const Redis = require('ioredis');

		const env = useEnv();

		config.storeClient = new Redis(env[`REDIS`] || getConfigFromEnv(`REDIS_`));
	}

	delete config.enabled;
	delete config.store;

	merge(config, overrides || {});

	return config;
}
