import { useEnv } from '@directus/env';
import type { RateLimiterMemory, RateLimiterRedis } from 'rate-limiter-flexible';
import { validateEnv } from '../utils/validate-env.js';
import { createRateLimiter } from './index.js';

const _cache = {
	rateLimiterIp: undefined as RateLimiterRedis | RateLimiterMemory | undefined,
};

/**
 * Returns globally shared IP rate limiter instance.
 */
export const useRateLimiterIp = () => {
	if (_cache.rateLimiterIp) return _cache.rateLimiterIp;

	const env = useEnv();

	if (!env['RATE_LIMITER_ENABLED']) return;

	validateEnv(['RATE_LIMITER_STORE', 'RATE_LIMITER_DURATION', 'RATE_LIMITER_POINTS']);

	_cache.rateLimiterIp = createRateLimiter('RATE_LIMITER');

	return _cache.rateLimiterIp;
};
