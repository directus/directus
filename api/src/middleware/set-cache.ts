/**
 *  Caching using redis
 *  and node caching
 */
import { RequestHandler } from 'express';
import redis from 'redis';
import NodeCache from 'node-cache';
import asyncHandler from 'express-async-handler';
import CacheService from '../services/cache';
import { RedisNotFoundException } from '../exceptions';
import env from '../env';

const redisClient = redis.createClient({
	enable_offline_queue: false,
	host: env.CACHE_HOST,
	port: env.CACHE_PORT,
	password: env.CACHE_REDIS_PASSWORD,
});

const setCacheMiddleware: RequestHandler = asyncHandler(async (req, res, next) => {
	// setting the cache

	if (env.CACHE_ENABLED !== 'true') return next();

	//key needs to have url, query and permissions

	const key = `${req.url}${req.query}${req.permissions}`;

	// we have two options here. Redis or node cache
	if (env.CACHE_DRIVER === 'redis') {
		if (!redisClient) {
			throw new RedisNotFoundException('Redis client does not exist');
		}

		redisClient.setex(key, env.CACHE_TTL, JSON.stringify(res.json));
	} else {
		const cacheService = new CacheService();
		cacheService.setCache(key, JSON.stringify(res.json));
	}

	return next();
});

export default setCacheMiddleware;
