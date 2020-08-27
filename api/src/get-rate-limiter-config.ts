import {
	RateLimiterRedis,
	RateLimiterMemory,
	RateLimiterMemcache,
	IRateLimiterStoreOptions,
	IRateLimiterOptions,
} from 'rate-limiter-flexible';
import parseEnv from './utils/parse-env';
import { RedisNotFoundException, MemCacheNotFoundException } from './exceptions';
import env from './env';

// options for the rate limiter are set below. Opts can be found
// at https://github.com/animir/node-rate-limiter-flexible/wiki/Options
let rateLimiterConfig = new RateLimiterMemory(getRateLimiterConfig());

switch (env.RATE_LIMIT_DRIVER) {
	case 'memcache': {
		rateLimiterConfig = new RateLimiterMemcache(getRateLimiterMemCacheConfig());
		break;
	}
	case 'redis': {
		rateLimiterConfig = new RateLimiterRedis(getRateLimiterRedisConfig());
		break;
	}
	default: {
		rateLimiterConfig = new RateLimiterMemory(getRateLimiterConfig());
		break;
	}
}

export default rateLimiterConfig;

function getRateLimiterConfig(): IRateLimiterOptions {
	const config: any = {};
	for (const [key, value] of Object.entries(env)) {
		if (key === 'CONSUMED_POINTS_LIMIT') {
			config.points = value;
			continue;
		}
		if (key === 'CONSUMED_RESET_DURATION') {
			config.duration = value;
			continue;
		}
	}

	return config;
}

function getRateLimiterRedisConfig(): IRateLimiterStoreOptions {
	const redis = require('redis');
	const redisConfig = parseEnv(0, 'redis');
	const redisClient = redis.createClient({
		enable_offline_queue: false,
		host: env.RATE_LIMIT_HOST,
		port: env.RATE_LIMIT_PORT,
		password: env.RATE_LIMIT_REDIS_PASSWORD,
	});

	if (!redisClient) {
		throw new RedisNotFoundException('Redis client does not exist');
	}

	redisConfig.storeClient = redisClient;

	return redisConfig;
}

function getRateLimiterMemCacheConfig(): IRateLimiterStoreOptions {
	const Memcached = require('memcached');

	const memCacheClient = Memcached.createClient({
		host: env.RATE_LIMIT_HOST,
		port: env.RATE_LIMIT_PORT,
	});

	if (!Memcached) {
		throw new MemCacheNotFoundException('Cannot connect to memcache');
	}

	const config: any = {};
	for (const [key, value] of Object.entries(env)) {
		if (key === 'CONSUMED_POINTS_LIMIT') {
			config.points = value;
			continue;
		}
		if (key === 'CONSUMED_RESET_DURATION') {
			config.duration = value;
			continue;
		}
	}
	config.storeClient = memCacheClient;

	return config;
}
