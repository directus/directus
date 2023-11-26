import type { BusConfig } from '../types/config.js';
import { BusLocal } from './local.js';
// import { BusRedis } from "./redis.js"

export const createBus = (config: BusConfig) => {
	if (config.type === 'local') {
		return new BusLocal(config);
	}

	// if (config.type === 'redis') {
	// 	return new BusRedis(config);
	// }

	// if (config.type === 'multi') {
	// 	return new BusMulti(config);
	// }

	throw new Error(`Invalid configuration: Type does not exist.`);
};
