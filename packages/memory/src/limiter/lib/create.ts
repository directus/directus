import type { LimiterConfig } from '../types/config.js';
import { LimiterLocal } from './local.js';
import { LimiterRedis } from './redis.js';

export const createLimiter = (config: LimiterConfig) => {
	if (config.type === 'local') {
		return new LimiterLocal(config);
	}

	if (config.type === 'redis') {
		return new LimiterRedis(config);
	}

	throw new Error(`Invalid Limiter configuration: Type does not exist.`);
};
