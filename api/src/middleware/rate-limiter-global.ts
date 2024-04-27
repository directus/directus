import { useEnv } from '@directus/env';
import { HitRateLimitError } from '@directus/errors';
import { RateLimiterRes } from '../rate-limiter/index.js';
import { useRateLimiterGlobal } from '../rate-limiter/use-rate-limiter-global.js';
import asyncHandler from '../utils/async-handler.js';

export const rateLimiterGlobal = asyncHandler(async (_req, res, next) => {
	const rateLimiter = useRateLimiterGlobal();

	try {
		await rateLimiter?.consume('global-rate-limit', 1);
	} catch (error) {
		if (!(error instanceof RateLimiterRes)) throw error;

		const env = useEnv();

		res.set('Retry-After', String(Math.round(error.msBeforeNext / 1000)));
		throw new HitRateLimitError({
			limit: +(env['RATE_LIMITER_GLOBAL_POINTS'] as string),
			reset: new Date(Date.now() + error.msBeforeNext),
		});
	}

	return next();
});
