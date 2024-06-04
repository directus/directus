import { useEnv } from '@directus/env';
import type { RateLimiterMemory, RateLimiterRedis } from 'rate-limiter-flexible';
import { validateEnv } from '../utils/validate-env.js';
import { createRateLimiter } from './index.js';

const _cache = {
	rateLimiterRegistration: undefined as RateLimiterRedis | RateLimiterMemory | undefined,
};

/**
 * Returns globally shared registration rate limiter instance.
 */
export const useRateLimiterRegistration = () => {
	if (_cache.rateLimiterRegistration) return _cache.rateLimiterRegistration;

	const env = useEnv();

	if (!env['RATE_LIMITER_REGISTRATION_ENABLED']) return;

	validateEnv(['RATE_LIMITER_REGISTRATION_DURATION', 'RATE_LIMITER_REGISTRATION_POINTS']);

	_cache.rateLimiterRegistration = createRateLimiter('RATE_LIMITER_REGISTRATION');

	return _cache.rateLimiterRegistration;
};
