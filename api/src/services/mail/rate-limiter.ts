import { useEnv } from '@directus/env';
import { RateLimiterQueue, RateLimiterRes } from 'rate-limiter-flexible';
import { createRateLimiter } from '../../rate-limiter.js';
import { toBoolean } from '@directus/utils';
import { EmailLimitExceededError } from '@directus/errors';

let emailRateLimiterQueue: RateLimiterQueue | undefined;

const env = useEnv();

if (toBoolean(env['EMAIL_LIMITER_ENABLED']) === true) {
	emailRateLimiterQueue = new RateLimiterQueue(createRateLimiter('EMAIL_LIMITER'), {
		maxQueueSize: Number(env['EMAIL_LIMITER_QUEUE_SIZE']),
	});
}

export async function useEmailRateLimiterQueue() {
	if (!emailRateLimiterQueue) return;

	try {
		await emailRateLimiterQueue.removeTokens(1);
	} catch (err: unknown) {
		if (err instanceof RateLimiterRes) {
			throw new EmailLimitExceededError({
				points: 'EMAIL_LIMITER_POINTS' in env ? Number(env['EMAIL_LIMITER_POINTS']) : undefined,
				duration: 'EMAIL_LIMITER_DURATION' in env ? Number(env['EMAIL_LIMITER_DURATION']) : undefined,
				message: 'EMAIL_LIMITER_ERROR_MESSAGE' in env ? String(env['EMAIL_LIMITER_ERROR_MESSAGE']) : undefined,
			});
		}

		throw err;
	}
}
