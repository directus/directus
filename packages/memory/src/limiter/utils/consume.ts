import { HitRateLimitError } from '@directus/errors';
import type { IRateLimiterRes, RateLimiterAbstract } from 'rate-limiter-flexible';

/**
 * Shared consume handler
 *
 * @param limiter Rate limiter instance. Intended for memory or redis
 * @param key Key to consume a point for
 * @param availablePoints Total configured available points
 */
export const consume = async (limiter: RateLimiterAbstract, key: string, availablePoints: number): Promise<void> => {
	try {
		await limiter.consume(key);
	} catch (err) {
		if (err instanceof Error) {
			throw err;
		}

		const { msBeforeNext } = err as IRateLimiterRes;

		throw new HitRateLimitError({
			limit: availablePoints,
			// as far as I understand from the rate-limiter-flexible docs, msBeforeNext is never
			// undefined. Might be a type error in their exported types.
			reset: new Date(Date.now() + msBeforeNext!),
		});
	}
};
