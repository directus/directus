import { useEnv } from '@directus/env';
import { HitRateLimitError } from '@directus/errors';
import { RateLimiterRes } from '../rate-limiter/index.js';
import { useRateLimiterIp } from '../rate-limiter/use-rate-limiter-ip.js';
import asyncHandler from '../utils/async-handler.js';
import { getIPFromReq } from '../utils/get-ip-from-req.js';

export const rateLimiterIp = asyncHandler(async (req, res, next) => {
	const ip = getIPFromReq(req);

	if (!ip) return next();

	const rateLimiter = useRateLimiterIp();

	try {
		await rateLimiter?.consume(ip, 1);
	} catch (error) {
		if (!(error instanceof RateLimiterRes)) throw error;

		const env = useEnv();

		res.set('Retry-After', String(Math.round(error.msBeforeNext / 1000)));
		throw new HitRateLimitError({
			limit: +(env['RATE_LIMITER_POINTS'] as string),
			reset: new Date(Date.now() + error.msBeforeNext),
		});
	}

	return next();
});
