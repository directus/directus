import { useEnv } from '@directus/env';
import { EmailLimitExceededError } from '@directus/errors';
import { RateLimiterQueue } from 'rate-limiter-flexible';
import { createRateLimiter } from '../../rate-limiter.js';

let emailRateLimiterQueue: RateLimiterQueue | undefined;

const env = useEnv();

if (env.RATE_LIMITER_EMAIL_ENABLED) {
	emailRateLimiterQueue = new RateLimiterQueue(createRateLimiter('RATE_LIMITER_EMAIL'), {
		maxQueueSize: env.RATE_LIMITER_EMAIL_QUEUE_SIZE,
	});
}

export async function useEmailRateLimiterQueue() {
	if (!emailRateLimiterQueue) return;

	try {
		await emailRateLimiterQueue.removeTokens(1);
	} catch (err: unknown) {
		if (err instanceof Error) {
			throw new EmailLimitExceededError({
				points: env.RATE_LIMITER_EMAIL_POINTS,
				duration: env.RATE_LIMITER_EMAIL_DURATION,
				message: env.RATE_LIMITER_EMAIL_ERROR_MESSAGE,
			});
		}

		throw err;
	}
}
