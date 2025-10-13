import { useEnv } from '@directus/env';
import { RateLimiterMemory, RateLimiterRedis } from 'rate-limiter-flexible';
import { createRateLimiter } from '../../rate-limiter.js';
import { toBoolean } from '@directus/utils';
import { EmailLimitExceededError } from '@directus/errors';

let emailRateLimiter: RateLimiterRedis | RateLimiterMemory | undefined;

const env = useEnv();

if (toBoolean(env['EMAIL_FLOWS_LIMITER_ENABLED']) === true) {
	emailRateLimiter = createRateLimiter('EMAIL_FLOWS_LIMITER');
}

export async function useFlowsEmailRateLimiter(flow_id: string) {
	if (!emailRateLimiter) return;

	try {
		await emailRateLimiter.consume(flow_id, 1);
	} catch (err: unknown) {
		if (err instanceof Error) {
			throw new EmailLimitExceededError({
				points: 'EMAIL_LIMITER_POINTS' in env ? Number(env['EMAIL_LIMITER_POINTS']) : undefined,
				duration: 'EMAIL_LIMITER_DURATION' in env ? Number(env['EMAIL_LIMITER_DURATION']) : undefined,
				message: 'EMAIL_LIMITER_ERROR_MESSAGE' in env ? String(env['EMAIL_LIMITER_ERROR_MESSAGE']) : undefined,
			});
		}

		throw err;
	}
}
