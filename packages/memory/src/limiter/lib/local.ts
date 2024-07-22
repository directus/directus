import { RateLimiterMemory } from 'rate-limiter-flexible';
import type { Limiter } from '../types/class.js';
import type { LimiterConfigLocal } from '../types/config.js';
import { consume } from '../utils/consume.js';

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
		return await consume(this.limiter, key, this.points);
	}

	async delete(key: string) {
		await this.limiter.delete(key);
	}
}
