/**
 *  RateLimiter using Redis
 *  and rate-limiter-flexible
 *  can extend with further options
 *  in future
 */
import { RequestHandler } from 'express';
import asyncHandler from 'express-async-handler';
import { HitRateLimitException } from '../exceptions';
import { RedisNotFoundException } from '../exceptions';
import rateLimiterConfig from '../rate-limiter';

const rateLimiter: RequestHandler = asyncHandler(async (req, res, next) => {
	try {
		await rateLimiterConfig.consume(req.ip);
	} catch (rejRes) {
		if (rejRes instanceof Error) {
			throw new RedisNotFoundException('Redis is having some trouble connecting');
		}
		// If there is no error, rateLimiterRedis promise rejected with number of ms before next request allowed
		const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
		res.set('Retry-After', String(secs));
		throw new HitRateLimitException(`Too many requests, retry after ${secs}.`);
	}

	return next();
});

export default rateLimiter;
