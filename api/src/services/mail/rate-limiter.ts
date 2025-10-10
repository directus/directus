import { useEnv } from '@directus/env';
import { RateLimiterQueue } from 'rate-limiter-flexible';
import { createRateLimiter } from '../../rate-limiter.js';
import { toBoolean } from '@directus/utils';
import { HitRateLimitError } from '@directus/errors';

let emailRateLimiterQueue: RateLimiterQueue | undefined;

const env = useEnv();

if (toBoolean(env['EMAIL_LIMITER_ENABLED']) === true) {
	const rateLimiter = createRateLimiter('EMAIL_LIMITER');

	emailRateLimiterQueue = new RateLimiterQueue(rateLimiter, {
		maxQueueSize: Number(env['EMAIL_LIMITER_QUEUE_SIZE']),
	});
}

export async function useEmailRateLimiterQueue() {
	if (!emailRateLimiterQueue) return;

	try {
		await emailRateLimiterQueue.removeTokens(1);
	} catch (err: unknown) {
		// RateLimiterQueueError is not exported for more precise error handling
		if (err instanceof Error) {
			// perhaps we should use an error that does not require `limit` and `reset`
			throw new HitRateLimitError(
				{
					limit: Number(env['EMAIL_LIMITER_POINTS'] as string),
					reset: new Date(Date.now() + Number(env['EMAIL_LIMITER_DURATION']) * 1000),
				},
				{
					cause: err.message,
				},
			);
		}

		throw err;
	}
}
