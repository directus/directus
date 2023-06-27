import { Redis } from 'ioredis';
import { toNumber, toString } from 'lodash-es';
import { getEnv } from '../env.js';
import { getRedisOptions } from './get-redis-options.js';
import { hasRedisConfiguration } from './has-redis-configuration.js';

let redis: Redis;

export const getRedis = () => {
	const env = getEnv();

	if (!hasRedisConfiguration(env)) return null;

	if (redis) {
		return redis;
	}

	if (env['REDIS_CONNECTION_STRING']) {
		redis = new Redis(env['REDIS_CONNECTION_STRING'], getRedisOptions(env));
	} else {
		redis = new Redis(toNumber(env['REDIS_PORT']), toString(env['REDIS_HOST']), getRedisOptions(env));
	}

	return redis;
};
