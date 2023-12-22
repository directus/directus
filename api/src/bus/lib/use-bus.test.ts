import { createBus, type BusLocal, type BusRedis } from '@directus/memory';
import type { Redis } from 'ioredis';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { redisConfigAvailable, useRedis } from '../../redis/index.js';
import { _cache, useBus } from './use-bus.js';

vi.mock('../../redis/index.js');
vi.mock('@directus/memory');

let fakeBus: BusLocal | BusRedis;

beforeEach(() => {
	fakeBus = {} as unknown as BusLocal;
	vi.mocked(createBus).mockReturnValue(fakeBus);
});

afterEach(() => {
	vi.clearAllMocks();
	_cache.bus = undefined;
});

test('Returns existing bus if exists', () => {
	_cache.bus = fakeBus;

	const bus = useBus();

	expect(bus).toBe(fakeBus);
});

test('Creates Redis based bus if Redis configuration is available', () => {
	const fakeRedis = {} as unknown as Redis;
	vi.mocked(redisConfigAvailable).mockReturnValue(true);
	vi.mocked(useRedis).mockReturnValue(fakeRedis);

	useBus();

	expect(createBus).toHaveBeenCalledWith({
		type: 'redis',
		redis: fakeRedis,
		namespace: 'directus:bus',
	});

	expect(_cache.bus).toBe(fakeBus);
});

test('Creates Local bus if Redis configuration is unavailable', () => {
	vi.mocked(redisConfigAvailable).mockReturnValue(false);

	useBus();

	expect(createBus).toHaveBeenCalledWith({
		type: 'local',
	});

	expect(_cache.bus).toBe(fakeBus);
});

test('Returns created bus', () => {
	vi.mocked(redisConfigAvailable).mockReturnValue(false);

	const bus = useBus();

	expect(bus).toBe(_cache.bus);
	expect(bus).toBe(fakeBus);
});
