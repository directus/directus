import type { Redis } from 'ioredis';

export interface LimiterConfigAbstract {
	/**
	 * Where the limit consumption is tracked
	 *
	 * `local` - Local memory. Only intended for single-process instances.
	 * `redis` - Redis instance
	 */
	type: 'local' | 'redis';

	duration: number;
	points: number;
}

export interface LimiterConfigLocal extends LimiterConfigAbstract {
	type: 'local';
}

export interface LimiterConfigRedis extends LimiterConfigAbstract {
	type: 'redis';

	/**
	 * Used to prefix the keys in Redis
	 */
	namespace: string;

	/**
	 * Existing or new Redis connection to use with this memory class
	 */
	redis: Redis;
}

export type LimiterConfig = LimiterConfigLocal | LimiterConfigRedis;
