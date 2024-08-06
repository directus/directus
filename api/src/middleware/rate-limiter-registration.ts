import { useEnv } from '@directus/env';
import { HitRateLimitError } from '@directus/errors';
import type { RequestHandler } from 'express';
import type { RateLimiterMemory, RateLimiterRedis } from 'rate-limiter-flexible';
import { createRateLimiter } from '../rate-limiter.js';
import asyncHandler from '../utils/async-handler.js';
import { getIPFromReq } from '../utils/get-ip-from-req.js';
import { validateEnv } from '../utils/validate-env.js';

let checkRateLimit: RequestHandler = (_req, _res, next) => next();

export let rateLimiter: RateLimiterRedis | RateLimiterMemory;

const env = useEnv();

if (env['RATE_LIMITER_REGISTRATION_ENABLED'] === true) {
	validateEnv(['RATE_LIMITER_REGISTRATION_DURATION', 'RATE_LIMITER_REGISTRATION_POINTS']);

	rateLimiter = createRateLimiter('RATE_LIMITER_REGISTRATION');

	checkRateLimit = asyncHandler(async (req, res, next) => {
		const ip = getIPFromReq(req);

		if (ip) {
			try {
				await rateLimiter.consume(ip, 1);
			} catch (rateLimiterRes: any) {
				if (rateLimiterRes instanceof Error) throw rateLimiterRes;

				res.set('Retry-After', String(Math.round(rateLimiterRes.msBeforeNext / 1000)));
				throw new HitRateLimitError({
					limit: +(env['RATE_LIMITER_REGISTRATION_POINTS'] as string),
					reset: new Date(Date.now() + rateLimiterRes.msBeforeNext),
				});
			}
		}

		next();
	});
}

export default checkRateLimit;
