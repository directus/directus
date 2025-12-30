import type { BusConfig } from '../index.js';
import { createBus } from './create.js';
import { BusLocal } from './local.js';
import { BusRedis } from './redis.js';
import { expect, test, vi } from 'vitest';

vi.mock('./local.js');
vi.mock('./redis.js');

test('Creates local cache for type local', () => {
	const config = { type: 'local' } as unknown as BusConfig;

	const cache = createBus(config);
	expect(BusLocal).toHaveBeenCalledWith(config);
	expect(cache).toBeInstanceOf(BusLocal);
});

test('Creates redis cache for type redis', () => {
	const config = { type: 'redis' } as unknown as BusConfig;

	const cache = createBus(config);
	expect(BusRedis).toHaveBeenCalledWith(config);
	expect(cache).toBeInstanceOf(BusRedis);
});

test('Throws an error for unknown types', () => {
	const config = { type: 'WRONG' } as unknown as BusConfig;

	expect(() => createBus(config)).toThrowError();
});
