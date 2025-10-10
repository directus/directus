import { useEnv } from '@directus/env';
import { RateLimiterMemory, RateLimiterRedis } from 'rate-limiter-flexible';
import { createRateLimiter } from '../../rate-limiter.js';
import { toBoolean } from '@directus/utils';
import { HitRateLimitError } from '@directus/errors';

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
			const resetIn = (err as unknown as any)?.msBeforeNext ?? Number(env['EMAIL_FLOWS_LIMITER_DURATION']) * 1000;
			// perhaps we should use an error that does not require `limit` and `reset`
			throw new HitRateLimitError(
				{
					limit: Number(env['EMAIL_FLOWS_LIMITER_POINTS'] as string),
					reset: new Date(Date.now() + resetIn),
				},
				{
					cause: err.message,
				},
			);
		}

		throw err;
	}
}
