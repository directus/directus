/**
 *  Caching using redis
 *  and node caching
 */
import { RequestHandler } from 'express';
import redis from 'redis';
import asyncHandler from 'express-async-handler';
import CacheService from '../services/node-cache';
import { RedisNotFoundException } from '../exceptions';
import env from '../env';
import NodeCache from 'node-cache';
const redisClient = redis.createClient({
	enable_offline_queue: false,
	host: env.REDIS_HOST,
	port: env.REDIS_PORT,
	password: env.REDIS_PASSWORD,
});

const cacheMiddleware: RequestHandler = asyncHandler(async (req, res, next) => {
	// make the key of the cache the URL
	// need to check that this will work for all endpoints
	// node cache service

	if (!req.query.TTL) return next();
	if (!req.query.dTTL) return next();

	const key = req.url;
	const TTL = req.query.TTL;
	const checkDeath = req.query.dTTL;

	// we have two options here. Redis or node cache
	if (env.CACHE_TYPE === 'redis') {
		if (!redisClient) {
			throw new RedisNotFoundException('Redis client does not exist');
		}

		redisClient.get(key, (error, resultData) => {
			if (error) {
				throw new RedisNotFoundException('Error retreiving redis cache');
			}

			if (resultData) {
				res.send(resultData);
			}
			if (!resultData) {
				// set data and then return
				redisClient.setex(key, TTL, JSON.stringify(res.json));
			}
		});
	} else {
		// use the node cache
		// set for ten minutes
		const nodeCache = new CacheService(TTL, checkDeath);

		nodeCache.getCache(key, JSON.stringify(res.json));
	}

	return next();
});

export default cacheMiddleware;
