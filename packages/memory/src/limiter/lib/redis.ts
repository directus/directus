import type { Limiter } from '../types/class.js';
import type { LimiterConfigRedis } from '../types/config.js';
import { consume } from '../utils/consume.js';
import { RateLimiterRedis } from 'rate-limiter-flexible';

export class LimiterRedis implements Limiter {
	private limiter: RateLimiterRedis;
	private points: number;

	constructor(config: Omit<LimiterConfigRedis, 'type'>) {
		this.limiter = new RateLimiterRedis({
			storeClient: config.redis,
			keyPrefix: config.namespace,
			points: config.points,
			duration: config.duration,
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
