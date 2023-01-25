import { RequestHandler } from 'express';
import ms from 'ms';
import { RateLimiterMemcache, RateLimiterMemory, RateLimiterRedis } from 'rate-limiter-flexible';
import env from '../env';
import { HitRateLimitException } from '../exceptions/index';
import { createRateLimiter } from '../rate-limiter';
import asyncHandler from '../utils/async-handler';
import { validateEnv } from '../utils/validate-env';

const GLOBAL_RATE_LIMITER_KEY = 'global-rate-limit';
let checkRateLimit: RequestHandler = (_req, _res, next) => next();
export let globalRateLimiter: RateLimiterRedis | RateLimiterMemcache | RateLimiterMemory;

if (env.RATE_LIMITER_GLOBAL_ENABLED === true) {
	validateEnv(['RATE_LIMITER_GLOBAL_STORE', 'RATE_LIMITER_GLOBAL_DURATION', 'RATE_LIMITER_GLOBAL_POINTS']);

	globalRateLimiter = createRateLimiter('RATE_LIMITER_GLOBAL');

	checkRateLimit = asyncHandler(async (_req, res, next) => {
		try {
			await globalRateLimiter.consume(GLOBAL_RATE_LIMITER_KEY, 1);
		} catch (rateLimiterRes: any) {
			if (rateLimiterRes instanceof Error) throw rateLimiterRes;

			res.set('Retry-After', String(rateLimiterRes.msBeforeNext / 1000));
			throw new HitRateLimitException(`Too many requests, retry after ${ms(rateLimiterRes.msBeforeNext)}.`, {
				limit: +env.RATE_LIMITER_GLOBAL_POINTS,
				reset: new Date(Date.now() + rateLimiterRes.msBeforeNext),
			});
		}

		next();
	});
}

export default checkRateLimit;
