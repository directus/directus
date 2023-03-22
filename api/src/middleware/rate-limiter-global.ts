import type { RequestHandler } from 'express';
import ms from 'ms';
import type { RateLimiterMemcache, RateLimiterMemory, RateLimiterRedis } from 'rate-limiter-flexible';
import env from '../env';
import { HitRateLimitException } from '../exceptions/index';
import logger from '../logger';
import { createRateLimiter } from '../rate-limiter';
import asyncHandler from '../utils/async-handler';
import { validateEnv } from '../utils/validate-env';

const RATE_LIMITER_GLOBAL_KEY = 'global-rate-limit';

let checkRateLimit: RequestHandler = (_req, _res, next) => next();
export let rateLimiterGlobal: RateLimiterRedis | RateLimiterMemcache | RateLimiterMemory;

if (env.RATE_LIMITER_GLOBAL_ENABLED === true) {
	validateEnv(['RATE_LIMITER_GLOBAL_STORE', 'RATE_LIMITER_GLOBAL_DURATION', 'RATE_LIMITER_GLOBAL_POINTS']);
	validateConfiguration();

	rateLimiterGlobal = createRateLimiter('RATE_LIMITER_GLOBAL');

	checkRateLimit = asyncHandler(async (_req, res, next) => {
		try {
			await rateLimiterGlobal.consume(RATE_LIMITER_GLOBAL_KEY, 1);
		} catch (rateLimiterRes: any) {
			if (rateLimiterRes instanceof Error) throw rateLimiterRes;

			res.set('Retry-After', String(Math.round(rateLimiterRes.msBeforeNext / 1000)));
			throw new HitRateLimitException(`Too many requests, retry after ${ms(rateLimiterRes.msBeforeNext)}.`, {
				limit: +env.RATE_LIMITER_GLOBAL_POINTS,
				reset: new Date(Date.now() + rateLimiterRes.msBeforeNext),
			});
		}

		next();
	});
}

export default checkRateLimit;

function validateConfiguration() {
	if (env.RATE_LIMITER_ENABLED !== true) {
		logger.error(`The IP based rate limiter needs to be enabled when using the global rate limiter.`);
		process.exit(1);
	}
	const globalPointsPerSec =
		Number(env.RATE_LIMITER_GLOBAL_POINTS) / Math.max(Number(env.RATE_LIMITER_GLOBAL_DURATION), 1);
	const regularPointsPerSec = Number(env.RATE_LIMITER_POINTS) / Math.max(Number(env.RATE_LIMITER_DURATION), 1);
	if (globalPointsPerSec <= regularPointsPerSec) {
		logger.error(`The global rate limiter needs to allow more requests per second than the IP based rate limiter.`);
		process.exit(1);
	}
}
