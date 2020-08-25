/**
 *  Caching using redis
 *  and node caching
 */
import { RequestHandler } from 'express';
import redis from 'redis';
import NodeCache from 'node-cache';
import asyncHandler from 'express-async-handler';
import CacheService from '../services/node-cache';
import { RedisNotFoundException } from '../exceptions';
import { InvalidCacheKeyException } from '../exceptions';
import env from '../env';

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
	// have used query as then can decide whather to use cache or not from api call

	if (!req.query.TTL) return next();
	if (!req.query.dTTL) return next();

	const TTLnumber = Number(req.query.TTL);
	const dTTL = Number(req.query.dTTL);

	const key = req.url;

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
				const reponse = JSON.parse(resultData);
				res.json(reponse);
			}
		});
	} else {
		const cacheService = new CacheService(TTLnumber, dTTL);
		res.json(cacheService.getCache(key));
	}

	return next();
});

export default cacheMiddleware;
