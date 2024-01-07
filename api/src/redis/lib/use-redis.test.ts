import { useEnv } from '@directus/env';
import { Redis } from 'ioredis';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { getConfigFromEnv } from '../../utils/get-config-from-env.js';
import { _cache, useRedis } from './use-redis.js';

vi.mock('ioredis');
vi.mock('../../utils/get-config-from-env.js');
vi.mock('@directus/env');

let mockRedis: Redis;

beforeEach(() => {
	mockRedis = new Redis();
	vi.mocked(Redis).mockReturnValue(mockRedis);
	vi.mocked(useEnv).mockReturnValue({});
});

afterEach(() => {
	_cache.redis = undefined;
});

describe('useRedis', () => {
	test('Returns cached redis connection if exists', () => {
		_cache.redis = mockRedis;

		const redis = useRedis();

		expect(redis).toBe(mockRedis);
		expect(getConfigFromEnv).not.toHaveBeenCalled();
	});

	test('Creates new Redis instance with string env if exists', () => {
		const redis = useRedis();

		expect(redis).toBe(mockRedis);
	});
});
