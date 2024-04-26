import { useEnv } from '@directus/env';
import { HitRateLimitError } from '@directus/errors';
import type { RequestHandler } from 'express';
import type { RateLimiterMemory, RateLimiterRedis } from 'rate-limiter-flexible';
import { RateLimiterRes, createRateLimiter } from '../rate-limiter.js';
import asyncHandler from '../utils/async-handler.js';
import { getIPFromReq } from '../utils/get-ip-from-req.js';
import { validateEnv } from '../utils/validate-env.js';

let rateLimiterIpMiddleware: RequestHandler = (_req, _res, next) => next();

export let rateLimiterIp: RateLimiterRedis | RateLimiterMemory | undefined;

const env = useEnv();

if (env['RATE_LIMITER_ENABLED'] === true) {
	validateEnv(['RATE_LIMITER_STORE', 'RATE_LIMITER_DURATION', 'RATE_LIMITER_POINTS']);

	rateLimiterIp = createRateLimiter('RATE_LIMITER');

	rateLimiterIpMiddleware = asyncHandler(async (req, res, next) => {
		const ip = getIPFromReq(req);

		if (ip) {
			try {
				await rateLimiterIp?.consume(ip, 1);
			} catch (error) {
				if (!(error instanceof RateLimiterRes)) throw error;

				res.set('Retry-After', String(Math.round(error.msBeforeNext / 1000)));
				throw new HitRateLimitError({
					limit: +(env['RATE_LIMITER_POINTS'] as string),
					reset: new Date(Date.now() + error.msBeforeNext),
				});
			}
		}

		return next();
	});
}

export default rateLimiterIpMiddleware;
