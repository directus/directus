import { useEnv } from '@directus/env';
import { RateLimiterMemory, RateLimiterRedis } from 'rate-limiter-flexible';
import { createRateLimiter } from '../../rate-limiter.js';

let emailLimiter: RateLimiterRedis | RateLimiterMemory | undefined;

const env = useEnv();

if (Boolean(env['EMAIL_FLOWS_LIMITER_ENABLED']) === true) {
	emailLimiter = createRateLimiter('EMAIL_FLOWS_LIMITER');
}

export async function emailFlowsRateLimiter(flow_id: string) {
	if (emailLimiter) {
		await emailLimiter.consume(flow_id, 1);
	}
}
