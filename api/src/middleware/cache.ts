/**
 *  Caching using redis
 *  and node caching
 */
import { RequestHandler } from 'express';
import redis from 'redis';
import asyncHandler from 'express-async-handler';
import NodeCacheService from '../services/authentication';
import { RedisNotFoundException } from '../exceptions';
import env from '../env';
const redisClient = redis.createClient({
	enable_offline_queue: false,
	host: env.REDIS_HOST,
	port: env.REDIS_PORT,
	password: env.REDIS_PASSWORD,
});

const cache: RequestHandler = asyncHandler(async (req, res, next) => {
	// make the key of the cache the URL
	// need to check that this will work for all endpoints
	const key = req.url;
	// we have two options here. Redis or node cache
	if (env.CACHE_TYPE === 'redis') {
		if (!redisClient) {
			throw new RedisNotFoundException('Redis client does not exist');
		}
	}

	return next();
});

export default cache;
