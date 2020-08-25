/**
 *  RateLimiter using Redis
 *  and rate-limiter-flexible
 *  can extend with further options
 *  in future
 */
import { RequestHandler } from 'express';
import asyncHandler from 'express-async-handler';
import { HitRateLimitException } from '../exceptions';
import rateLimiterConfig from '../get-rate-limiter-config';

const rateLimiter: RequestHandler = asyncHandler(async (req, res, next) => {
	try {
		await rateLimiterConfig.consume(req.ip);
	} catch (rejRes) {
		// If there is no error, rateLimiterRedis promise rejected with number of ms before next request allowed
		const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
		res.set('Retry-After', String(secs));
		throw new HitRateLimitException(`Too many requests, retry after ${secs}.`);
	}

	return next();
});

export default rateLimiter;
