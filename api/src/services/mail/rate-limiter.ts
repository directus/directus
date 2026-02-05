import { useEnv } from '@directus/env';
import { EmailLimitExceededError } from '@directus/errors';
import { toBoolean } from '@directus/utils';
import { RateLimiterQueue } from 'rate-limiter-flexible';
import { createRateLimiter } from '../../rate-limiter.js';

let emailRateLimiterQueue: RateLimiterQueue | undefined;

const env = useEnv();

if (toBoolean(env['RATE_LIMITER_EMAIL_ENABLED']) === true) {
	emailRateLimiterQueue = new RateLimiterQueue(createRateLimiter('RATE_LIMITER_EMAIL'), {
		maxQueueSize: Number(env['RATE_LIMITER_EMAIL_QUEUE_SIZE']),
	});
}

export async function useEmailRateLimiterQueue() {
	if (!emailRateLimiterQueue) return;

	try {
		await emailRateLimiterQueue.removeTokens(1);
	} catch (err: unknown) {
		if (err instanceof Error) {
			throw new EmailLimitExceededError({
				points: 'RATE_LIMITER_EMAIL_POINTS' in env ? Number(env['RATE_LIMITER_EMAIL_POINTS']) : undefined,
				duration: 'RATE_LIMITER_EMAIL_DURATION' in env ? Number(env['RATE_LIMITER_EMAIL_DURATION']) : undefined,
				message:
					'RATE_LIMITER_EMAIL_ERROR_MESSAGE' in env ? String(env['RATE_LIMITER_EMAIL_ERROR_MESSAGE']) : undefined,
			});
		}

		throw err;
	}
}
