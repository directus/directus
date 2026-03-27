import { useEnv } from '@directus/env';
import { createKv, type KvLocal, type KvRedis } from '@directus/memory';
import type { Redis } from 'ioredis';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vite-plus/test';
import { redisConfigAvailable, useRedis } from '../../redis/index.js';
import { _cache, useCounters } from './use-counters.js';

vi.mock('@directus/env');
vi.mock('../../redis/index.js');
vi.mock('@directus/memory');

describe('useCounters', () => {
	let mockCounter: KvLocal | KvRedis;

	beforeEach(() => {
		mockCounter = {} as unknown as KvLocal;
		vi.mocked(createKv).mockReturnValue(mockCounter);
		vi.mocked(useEnv).mockReturnValue({ REDIS_COUNTERS_NAMESPACE: 'directus:counters' } as any);
	});

	afterEach(() => {
		vi.clearAllMocks();
		_cache.counter = null;
	});

	test('Returns existing counter if it exists', () => {
		_cache.counter = mockCounter;

		const counter = useCounters();

		expect(counter).toBe(mockCounter);
	});

	test('Creates Redis based counter if Redis configuration is available', () => {
		const mockRedis = {} as unknown as Redis;
		vi.mocked(redisConfigAvailable).mockReturnValue(true);
		vi.mocked(useRedis).mockReturnValue(mockRedis);

		useCounters();

		expect(createKv).toHaveBeenCalledWith({
			type: 'redis',
			redis: mockRedis,
			namespace: 'directus:counters',
		});

		expect(_cache.counter).toBe(mockCounter);
	});

	test('Creates Redis based counter with custom namespace from env', () => {
		const mockRedis = {} as unknown as Redis;
		vi.mocked(redisConfigAvailable).mockReturnValue(true);
		vi.mocked(useRedis).mockReturnValue(mockRedis);
		vi.mocked(useEnv).mockReturnValue({ REDIS_COUNTERS_NAMESPACE: 'tenant1:counters' } as any);

		useCounters();

		expect(createKv).toHaveBeenCalledWith({
			type: 'redis',
			redis: mockRedis,
			namespace: 'tenant1:counters',
		});
	});

	test('Creates Local counter if Redis configuration is unavailable', () => {
		vi.mocked(redisConfigAvailable).mockReturnValue(false);

		useCounters();

		expect(createKv).toHaveBeenCalledWith({
			type: 'local',
		});

		expect(_cache.counter).toBe(mockCounter);
	});

	test('Returns created counter', () => {
		vi.mocked(redisConfigAvailable).mockReturnValue(false);

		const counter = useCounters();

		expect(counter).toBe(_cache.counter);
		expect(counter).toBe(mockCounter);
	});

	test('Returns same instance on subsequent calls', () => {
		vi.mocked(redisConfigAvailable).mockReturnValue(false);

		const counterA = useCounters();
		const counterB = useCounters();

		expect(counterA).toBe(counterB);
		expect(createKv).toHaveBeenCalledTimes(1);
	});
});
