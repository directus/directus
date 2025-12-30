import { _cache, useBus } from './use-bus.js';
import { redisConfigAvailable, useRedis } from '../../redis/index.js';
import { type BusLocal, type BusRedis, createBus } from '@directus/memory';
import type { Redis } from 'ioredis';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

vi.mock('../../redis/index.js');
vi.mock('@directus/memory');

let mockBus: BusLocal | BusRedis;

beforeEach(() => {
	mockBus = {} as unknown as BusLocal;
	vi.mocked(createBus).mockReturnValue(mockBus);
});

afterEach(() => {
	vi.clearAllMocks();
	_cache.bus = undefined;
});

test('Returns existing bus if exists', () => {
	_cache.bus = mockBus;

	const bus = useBus();

	expect(bus).toBe(mockBus);
});

test('Creates Redis based bus if Redis configuration is available', () => {
	const mockRedis = {} as unknown as Redis;
	vi.mocked(redisConfigAvailable).mockReturnValue(true);
	vi.mocked(useRedis).mockReturnValue(mockRedis);

	useBus();

	expect(createBus).toHaveBeenCalledWith({
		type: 'redis',
		redis: mockRedis,
		namespace: 'directus:bus',
	});

	expect(_cache.bus).toBe(mockBus);
});

test('Creates Local bus if Redis configuration is unavailable', () => {
	vi.mocked(redisConfigAvailable).mockReturnValue(false);

	useBus();

	expect(createBus).toHaveBeenCalledWith({
		type: 'local',
	});

	expect(_cache.bus).toBe(mockBus);
});

test('Returns created bus', () => {
	vi.mocked(redisConfigAvailable).mockReturnValue(false);

	const bus = useBus();

	expect(bus).toBe(_cache.bus);
	expect(bus).toBe(mockBus);
});
