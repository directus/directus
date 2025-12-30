import { BusLocal } from './local.js';
import { BusRedis } from './redis.js';
import type { BusConfig } from '../types/config.js';

export const createBus = (config: BusConfig) => {
	if (config.type === 'local') {
		return new BusLocal(config);
	}

	if (config.type === 'redis') {
		return new BusRedis(config);
	}

	throw new Error(`Invalid Bus configuration: Type does not exist.`);
};
