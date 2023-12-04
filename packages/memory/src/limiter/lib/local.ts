import { HitRateLimitError } from '@directus/errors';
import type { IRateLimiterRes } from 'rate-limiter-flexible';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import type { Limiter } from '../types/class.js';
import type { LimiterConfigLocal } from '../types/config.js';

export class LimiterLocal implements Limiter {
	private limiter: RateLimiterMemory;
	private points: number;

	constructor(config: Omit<LimiterConfigLocal, 'type'>) {
		this.limiter = new RateLimiterMemory({
			duration: config.duration,
			points: config.points,
		});

		this.points = config.points;
	}

	async consume(key: string) {
		try {
			await this.limiter.consume(key);
		} catch (err) {
			if (err instanceof Error) {
				throw err;
			}

			const { msBeforeNext } = err as IRateLimiterRes;

			throw new HitRateLimitError(
				{
					limit: this.points,
					// as far as I understand from the rate-limiter-flexible docs, msBeforeNext is never
					// undefined. Might be a type error in their exported types.
					reset: new Date(Date.now() + msBeforeNext!),
				},
			);
		}
	}

	async delete(key: string) {
		await this.limiter.delete(key);
	}
}
