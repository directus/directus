import { useEnv } from '@directus/env';
import type { RateLimiterMemory, RateLimiterRedis } from 'rate-limiter-flexible';
import { useLogger } from '../logger.js';
import { validateEnv } from '../utils/validate-env.js';
import { createRateLimiter } from './index.js';

const _cache = {
	rateLimiterGlobal: undefined as RateLimiterRedis | RateLimiterMemory | undefined,
};

/**
 * Returns globally shared global rate limiter instance.
 */
export const useRateLimiterGlobal = () => {
	if (_cache.rateLimiterGlobal) return _cache.rateLimiterGlobal;

	const env = useEnv();

	if (!env['RATE_LIMITER_GLOBAL_ENABLED']) return;

	validateEnv(['RATE_LIMITER_GLOBAL_DURATION', 'RATE_LIMITER_GLOBAL_POINTS']);
	validateConfiguration();

	_cache.rateLimiterGlobal = createRateLimiter('RATE_LIMITER_GLOBAL');

	return _cache.rateLimiterGlobal;
};

function validateConfiguration() {
	const env = useEnv();
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
