import { useEnv } from '@directus/env';
import { EmailLimitExceededError } from '@directus/errors';
import { RateLimiterMemory, RateLimiterRedis, RateLimiterRes } from 'rate-limiter-flexible';
import { createRateLimiter } from '../../rate-limiter.js';

let emailRateLimiter: RateLimiterRedis | RateLimiterMemory | undefined;

const env = useEnv();

if (env.RATE_LIMITER_EMAIL_FLOWS_ENABLED) {
	emailRateLimiter = createRateLimiter('RATE_LIMITER_EMAIL_FLOWS');
}

export async function useFlowsEmailRateLimiter(flow_id: string) {
	if (!emailRateLimiter) return;

	try {
		await emailRateLimiter.consume(flow_id, 1);
	} catch (err: unknown) {
		if (err instanceof RateLimiterRes) {
			throw new EmailLimitExceededError({
				points: env.RATE_LIMITER_EMAIL_FLOWS_POINTS,
				duration: env.RATE_LIMITER_EMAIL_FLOWS_DURATION,
				message: env.RATE_LIMITER_EMAIL_FLOWS_ERROR_MESSAGE,
			});
		}

		throw err;
	}
}
