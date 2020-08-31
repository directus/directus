/**
 *  Caching using redis
 *  and node caching
 */
import { RequestHandler } from 'express';
import redis from 'redis';
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

const checkCacheMiddleware: RequestHandler = asyncHandler(async (req, res, next) => {
	// make the key of the cache the URL
	// need to check that this will work for all endpoints
	// node cache service
	// have used query as then can decide whather to use cache or not from api call
	if (env.CACHE_ENABLED !== 'true') return next();

	//key needs to have url, query and permissions

	const key = `${req.url}${req.query}${req.permissions}`;

	// we have two options here. Redis or node cache
	if (env.CACHE_DRIVER === 'redis') {
		if (!redisClient) {
			throw new RedisNotFoundException('Redis client does not exist');
		}

		redisClient.get(key, (error, resultData) => {
			if (error) {
				throw new RedisNotFoundException('Error retreiving redis cache');
			}

			if (resultData) {
				const reponse = JSON.parse(resultData);
				res.json(reponse);
			}
		});
	} else {
		const cacheService = new CacheService();
		res.json(cacheService.getCache(key));
	}

	return next();
});

export default checkCacheMiddleware;
