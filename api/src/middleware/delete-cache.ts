/**
 *  Caching using redis
 *  and node caching
 */
import { RequestHandler } from 'express';
import asyncHandler from 'express-async-handler';
import CacheService from '../services/cache';
import { RedisNotFoundException } from '../exceptions';
import env from '../env';

const delCacheMiddleware: RequestHandler = asyncHandler(async (req, res, next) => {
	// setting the cache

	if (env.CACHE_ENABLED !== 'true') return next();

	//key needs to have url, query and permissions

	const key = `${req.url}${req.query}${req.permissions}`;

	// we have two options here. Redis or node cache
	if (env.CACHE_DRIVER === 'redis') {
		const redis = require('redis');
		const redisClient = redis.createClient({
			enable_offline_queue: false,
			host: env.CACHE_HOST,
			port: env.CACHE_PORT,
			password: env.CACHE_REDIS_PASSWORD,
		});
		if (!redisClient) {
			throw new RedisNotFoundException('Redis client does not exist');
		}

		redisClient.del(key);
	} else {
		const cacheService = new CacheService();
		cacheService.delCache(key);
	}

	return next();
});

export default delCacheMiddleware;
