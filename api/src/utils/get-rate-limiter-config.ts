import redis from 'redis';
import {
	RateLimiterRedis,
	RateLimiterMemory,
	IRateLimiterStoreOptions,
	IRateLimiterOptions,
} from 'rate-limiter-flexible';
import { RedisNotFoundException } from '../exceptions';

import env from '../env';

// options for the rate limiter are set below. Opts can be found
// at https://github.com/animir/node-rate-limiter-flexible/wiki/Options

const redisClient = redis.createClient({
	enable_offline_queue: false,
	host: env.REDIS_HOST,
	port: env.REDIS_PORT,
	password: env.REDIS_PASSWORD,
});

let rateLimiterConfig = new RateLimiterMemory(getRateLimiterConfig());
// need to pick redis or memory
if (env.RATE_LIMIT_TYPE === 'redis') {
	rateLimiterConfig = new RateLimiterRedis(getRateLimiterRedisConfig());
}
// first need to check that redis is running!

if (!redisClient) {
	throw new RedisNotFoundException('Redis client does not exist');
}

export default rateLimiterConfig;

function getRateLimiterConfig(): IRateLimiterOptions {
	const config: any = {};
	config.keyPrefix = 'rlflx';
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
	const redisConfig: any = {};
	redisConfig.keyPrefix = 'rlflx';
	redisConfig.storeClient = redisClient;

	for (const [key, value] of Object.entries(env)) {
		if (key === 'CONSUMED_POINTS_LIMIT') {
			redisConfig.points = value;
			continue;
		}
		if (key === 'CONSUMED_RESET_DURATION') {
			redisConfig.duration = value;
			continue;
		}
		if (key === 'EXEC_EVENLY') {
			redisConfig.execEvenly = value;
			continue;
		}
		if (key === 'BLOCK_POINT_DURATION') {
			redisConfig.blockDuration = value;
			continue;
		}
		if (key === 'INMEMORY_BLOCK_CONSUMED') {
			redisConfig.inmemoryBlockOnConsumed = value;
			continue;
		}
		if (key === 'INMEMEMORY_BLOCK_DURATION') {
			redisConfig.inmemoryBlockDuration = value;
			continue;
		}
	}

	return redisConfig;
}
