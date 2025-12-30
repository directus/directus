import { createRateLimiter } from '../../rate-limiter.js';
import { useEnv } from '@directus/env';
import { EmailLimitExceededError } from '@directus/errors';
import { toBoolean } from '@directus/utils';
import { RateLimiterMemory, RateLimiterRedis, RateLimiterRes } from 'rate-limiter-flexible';

let emailRateLimiter: RateLimiterRedis | RateLimiterMemory | undefined;

const env = useEnv();

if (toBoolean(env['RATE_LIMITER_EMAIL_FLOWS_ENABLED']) === true) {
	emailRateLimiter = createRateLimiter('RATE_LIMITER_EMAIL_FLOWS');
}

export async function useFlowsEmailRateLimiter(flow_id: string) {
	if (!emailRateLimiter) return;

	try {
		await emailRateLimiter.consume(flow_id, 1);
	} catch (err: unknown) {
		if (err instanceof RateLimiterRes) {
			throw new EmailLimitExceededError({
				points: 'RATE_LIMITER_EMAIL_FLOWS_POINTS' in env ? Number(env['RATE_LIMITER_EMAIL_FLOWS_POINTS']) : undefined,
				duration:
					'RATE_LIMITER_EMAIL_FLOWS_DURATION' in env ? Number(env['RATE_LIMITER_EMAIL_FLOWS_DURATION']) : undefined,
				message:
					'RATE_LIMITER_EMAIL_FLOWS_ERROR_MESSAGE' in env
						? String(env['RATE_LIMITER_EMAIL_FLOWS_ERROR_MESSAGE'])
						: undefined,
			});
		}

		throw err;
	}
}
