/**
 *  RateLimiter using Redis
 *  and rate-limiter-flexible
 *  can extend with further options
 *  in future
 */
import { RequestHandler } from 'express';
import redis from 'redis';
import asyncHandler from 'express-async-handler';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { HitRateLimitException } from '../exceptions';
import { RedisNotFoundException } from '../exceptions';
import env from '../env';

const redisClient = redis.createClient({
	enable_offline_queue: false,
	host: env.REDIS_HOST,
	port: env.REDIS_PORT,
	password: env.REDIS_PASSWORD,
});

const rateLimiter: RequestHandler = asyncHandler(async (req, res, next) => {
	// first need to check that redis is running!
	if (!redisClient) {
		throw new RedisNotFoundException('Redis client does not exist');
	}
	// options for the rate limiter are set below. Opts can be found
	// at https://github.com/animir/node-rate-limiter-flexible/wiki/Options
	const opts = {
		storeClient: redisClient,
		points: env.CONSUMED_POINTS_LIMIT, // Number of points
		duration: env.CONSUMED_RESET_DURATION, // Number of seconds before consumed points are reset.

		// Custom
		execEvenly: env.EXEC_EVENLY, // delay actions after first action - this may need adjusting (leaky bucket)
		blockDuration: env.BLOCK_POINT_DURATION, // Do not block if consumed more than points
		keyPrefix: 'rlflx', // must be unique for limiters with different purpose
	};

	const rateLimiterRedis = new RateLimiterRedis(opts);

	try {
		await rateLimiterRedis.consume(req.ip);
	} catch (err) {
		// If there is no error, rateLimiterRedis promise rejected with number of ms before next request allowed
		const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
		res.set('Retry-After', String(secs));
		res.status(429).send('Too Many Requests');
		throw new HitRateLimitException(`Too many requests, retry after ${secs}.`);
	}

	return next();
});

export default rateLimiter;
