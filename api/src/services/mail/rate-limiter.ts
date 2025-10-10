import { useEnv } from '@directus/env';
import { RateLimiterQueue } from 'rate-limiter-flexible';
import { createRateLimiter } from '../../rate-limiter.js';
import { toBoolean } from '@directus/utils';

let emailRateLimiterQueue: RateLimiterQueue | undefined;

const env = useEnv();

export function getEmailRateLimiterQueue() {
	if (!emailRateLimiterQueue && toBoolean(env['EMAIL_LIMITER_ENABLED']) === true) {
		const rateLimiter = createRateLimiter('EMAIL_LIMITER');

		emailRateLimiterQueue = new RateLimiterQueue(rateLimiter, {
			maxQueueSize: Number(env['EMAIL_LIMITER_QUEUE_SIZE']),
		});
	}

	return emailRateLimiterQueue;
}
