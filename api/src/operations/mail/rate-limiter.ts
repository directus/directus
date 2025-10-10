import { useEnv } from '@directus/env';
import { RateLimiterMemory, RateLimiterRedis } from 'rate-limiter-flexible';
import { createRateLimiter } from '../../rate-limiter.js';
import { toBoolean } from '@directus/utils';

let emailRateLimiter: RateLimiterRedis | RateLimiterMemory | undefined;

const env = useEnv();

export function getFlowsEmailRateLimiter() {
	if (!emailRateLimiter && toBoolean(env['EMAIL_FLOWS_LIMITER_ENABLED']) === true) {
		emailRateLimiter = createRateLimiter('EMAIL_FLOWS_LIMITER');
	}

	return emailRateLimiter;
}
