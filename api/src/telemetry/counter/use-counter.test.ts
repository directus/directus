import { createKv, type KvLocal, type KvRedis } from '@directus/memory';
import type { Redis } from 'ioredis';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { redisConfigAvailable, useRedis } from '../../redis/index.js';
import { _cache, useCounter } from './use-counter.js';

vi.mock('../../redis/index.js');
vi.mock('@directus/memory');

describe('useCounter', () => {
	let mockCounter: KvLocal | KvRedis;

	beforeEach(() => {
		mockCounter = {} as unknown as KvLocal;
		vi.mocked(createKv).mockReturnValue(mockCounter);
	});

	afterEach(() => {
		vi.clearAllMocks();

		for (const key in _cache) {
			delete _cache[key];
		}
	});

	test('Returns existing counter for the same key if it exists', () => {
		_cache['test-key'] = mockCounter;

		const counter = useCounter('test-key');

		expect(counter).toBe(mockCounter);
	});

	test('Creates Redis based counter if Redis configuration is available', () => {
		const mockRedis = {} as unknown as Redis;
		vi.mocked(redisConfigAvailable).mockReturnValue(true);
		vi.mocked(useRedis).mockReturnValue(mockRedis);

		useCounter('test-key');

		expect(createKv).toHaveBeenCalledWith({
			type: 'redis',
			redis: mockRedis,
			namespace: 'directus:counter:test-key',
		});

		expect(_cache['test-key']).toBe(mockCounter);
	});

	test('Creates Local counter if Redis configuration is unavailable', () => {
		vi.mocked(redisConfigAvailable).mockReturnValue(false);

		useCounter('test-key');

		expect(createKv).toHaveBeenCalledWith({
			type: 'local',
		});

		expect(_cache['test-key']).toBe(mockCounter);
	});

	test('Returns created counter', () => {
		vi.mocked(redisConfigAvailable).mockReturnValue(false);

		const counter = useCounter('test-key');

		expect(counter).toBe(_cache['test-key']);
		expect(counter).toBe(mockCounter);
	});

	test('Caches counters independently per key', () => {
		const mockCounterA = { id: 'a' } as unknown as KvLocal;
		const mockCounterB = { id: 'b' } as unknown as KvLocal;

		vi.mocked(redisConfigAvailable).mockReturnValue(false);
		vi.mocked(createKv).mockReturnValueOnce(mockCounterA).mockReturnValueOnce(mockCounterB);

		const counterA = useCounter('key-a');
		const counterB = useCounter('key-b');

		expect(counterA).toBe(mockCounterA);
		expect(counterB).toBe(mockCounterB);
		expect(counterA).not.toBe(counterB);
		expect(createKv).toHaveBeenCalledTimes(2);
	});
});
