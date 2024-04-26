import { useEnv } from '@directus/env';
import { HitRateLimitError } from '@directus/errors';
import type { RequestHandler } from 'express';
import type { RateLimiterMemory, RateLimiterRedis } from 'rate-limiter-flexible';
import { useLogger } from '../logger.js';
import { RateLimiterRes, createRateLimiter } from '../rate-limiter.js';
import asyncHandler from '../utils/async-handler.js';
import { validateEnv } from '../utils/validate-env.js';

const RATE_LIMITER_GLOBAL_KEY = 'global-rate-limit';

let rateLimiterGlobalMiddleware: RequestHandler = (_req, _res, next) => next();

export let rateLimiterGlobal: RateLimiterRedis | RateLimiterMemory | undefined;

const env = useEnv();

if (env['RATE_LIMITER_GLOBAL_ENABLED'] === true) {
	validateEnv(['RATE_LIMITER_GLOBAL_STORE', 'RATE_LIMITER_GLOBAL_DURATION', 'RATE_LIMITER_GLOBAL_POINTS']);
	validateConfiguration();

	rateLimiterGlobal = createRateLimiter('RATE_LIMITER_GLOBAL');

	rateLimiterGlobalMiddleware = asyncHandler(async (_req, res, next) => {
		try {
			await rateLimiterGlobal?.consume(RATE_LIMITER_GLOBAL_KEY, 1);
		} catch (error) {
			if (!(error instanceof RateLimiterRes)) throw error;

			res.set('Retry-After', String(Math.round(error.msBeforeNext / 1000)));
			throw new HitRateLimitError({
				limit: +(env['RATE_LIMITER_GLOBAL_POINTS'] as string),
				reset: new Date(Date.now() + error.msBeforeNext),
			});
		}

		return next();
	});
}

export default rateLimiterGlobalMiddleware;

function validateConfiguration() {
	const logger = useLogger();

	if (env['RATE_LIMITER_ENABLED'] !== true) {
		logger.error(`The IP based rate limiter needs to be enabled when using the global rate limiter.`);
		process.exit(1);
	}

	const globalPointsPerSec =
		Number(env['RATE_LIMITER_GLOBAL_POINTS']) / Math.max(Number(env['RATE_LIMITER_GLOBAL_DURATION']), 1);

	const regularPointsPerSec = Number(env['RATE_LIMITER_POINTS']) / Math.max(Number(env['RATE_LIMITER_DURATION']), 1);

	if (globalPointsPerSec <= regularPointsPerSec) {
		logger.error(`The global rate limiter needs to allow more requests per second than the IP based rate limiter.`);
		process.exit(1);
	}
}
