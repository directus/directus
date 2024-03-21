import { createKv, type KvLocal, type KvRedis } from '@directus/memory';
import type { Redis } from 'ioredis';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { redisConfigAvailable, useRedis } from '../../redis/index.js';
import { _cache, useLock } from './use-lock.js';

vi.mock('../../redis/index.js');
vi.mock('@directus/memory');

let mockLock: KvLocal | KvRedis;

beforeEach(() => {
	mockLock = {} as unknown as KvLocal;
	vi.mocked(createKv).mockReturnValue(mockLock);
});

afterEach(() => {
	vi.clearAllMocks();
	_cache.lock = undefined;
});

test('Returns existing lock if exists', () => {
	_cache.lock = mockLock;

	const lock = useLock();

	expect(lock).toBe(mockLock);
});

test('Creates Redis based lock if Redis configuration is available', () => {
	const mockRedis = {} as unknown as Redis;
	vi.mocked(redisConfigAvailable).mockReturnValue(true);
	vi.mocked(useRedis).mockReturnValue(mockRedis);

	useLock();

	expect(createKv).toHaveBeenCalledWith({
		type: 'redis',
		redis: mockRedis,
		namespace: 'directus:lock',
	});

	expect(_cache.lock).toBe(mockLock);
});

test('Creates Local lock if Redis configuration is unavailable', () => {
	vi.mocked(redisConfigAvailable).mockReturnValue(false);

	useLock();

	expect(createKv).toHaveBeenCalledWith({
		type: 'local',
	});

	expect(_cache.lock).toBe(mockLock);
});

test('Returns created lock', () => {
	vi.mocked(redisConfigAvailable).mockReturnValue(false);

	const lock = useLock();

	expect(lock).toBe(_cache.lock);
	expect(lock).toBe(mockLock);
});
