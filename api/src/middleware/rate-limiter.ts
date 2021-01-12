import { RequestHandler } from 'express';
import asyncHandler from '../utils/async-handler';
import {
	RateLimiterMemory,
	RateLimiterRedis,
	RateLimiterMemcache,
	IRateLimiterOptions,
	IRateLimiterStoreOptions,
} from 'rate-limiter-flexible';
import env from '../env';
import { getConfigFromEnv } from '../utils/get-config-from-env';
import { HitRateLimitException } from '../exceptions';
import ms from 'ms';
import { validateEnv } from '../utils/validate-env';

let checkRateLimit: RequestHandler = (req, res, next) => next();
export let rateLimiter: RateLimiterRedis | RateLimiterMemcache | RateLimiterMemory;

if (env.RATE_LIMITER_ENABLED === true) {
	validateEnv(['RATE_LIMITER_STORE', 'RATE_LIMITER_DURATION', 'RATE_LIMITER_POINTS']);

	rateLimiter = getRateLimiter();

	checkRateLimit = asyncHandler(async (req, res, next) => {
		try {
			await rateLimiter.consume(req.ip, 1);
		} catch (rateLimiterRes) {
			if (rateLimiterRes instanceof Error) throw rateLimiterRes;

			res.set('Retry-After', String(rateLimiterRes.msBeforeNext / 1000));
			throw new HitRateLimitException(`Too many requests, retry after ${ms(rateLimiterRes.msBeforeNext)}.`, {
				limit: +env.RATE_LIMITER_POINTS,
				reset: new Date(Date.now() + rateLimiterRes.msBeforeNext),
			});
		}

		next();
	});
}

export default checkRateLimit;

function getRateLimiter() {
	switch (env.RATE_LIMITER_STORE) {
		case 'redis':
			return new RateLimiterRedis(getConfig('redis'));
		case 'memcache':
			return new RateLimiterMemcache(getConfig('memcache'));
		case 'memory':
		default:
			return new RateLimiterMemory(getConfig());
	}
}

function getConfig(store?: 'memory'): IRateLimiterOptions;
function getConfig(store: 'redis' | 'memcache'): IRateLimiterStoreOptions;
function getConfig(store: 'memory' | 'redis' | 'memcache' = 'memory'): IRateLimiterOptions | IRateLimiterStoreOptions {
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

	return config;
}
