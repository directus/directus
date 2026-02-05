import type { BusConfig } from '../types/config.js';
import { BusLocal } from './local.js';
import { BusRedis } from './redis.js';

export function createBus(config: Extract<BusConfig, { type: 'local' }>): BusLocal;
export function createBus(config: Extract<BusConfig, { type: 'redis' }>): BusRedis;
export function createBus(config: BusConfig) {
	if (config.type === 'local') {
		return new BusLocal(config);
	}

	if (config.type === 'redis') {
		return new BusRedis(config);
	}

	throw new Error(`Invalid Bus configuration: Type does not exist.`);
}
