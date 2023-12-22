import { Redis } from 'ioredis';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useEnv } from '../env.js';
import { getConfigFromEnv } from '../utils/get-config-from-env.js';
import { createRedis } from './create-redis.js';

vi.mock('ioredis');
vi.mock('../utils/get-config-from-env.js');
vi.mock('../env.js');

let mockRedis: Redis;

beforeEach(() => {
	mockRedis = new Redis();
	vi.mocked(Redis).mockReturnValue(mockRedis);
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('createRedis', () => {
	test('Creates and returns new Redis instance from connection string', () => {
		const connectionString = 'test-connection-string';
		const mockEnv = { REDIS: connectionString };
		vi.mocked(useEnv).mockReturnValue(mockEnv);

		const redis = createRedis();

		expect(Redis).toHaveBeenCalledWith(connectionString);
		expect(redis).toBe(mockRedis);
	});

	test('Uses Redis connection object if Redis connection string is missing', () => {
		const redisHost = 'test-host';
		const mockEnv = { REDIS_HOST: redisHost };
		vi.mocked(useEnv).mockReturnValue(mockEnv);

		const mockConfig = { host: redisHost };

		vi.mocked(getConfigFromEnv).mockReturnValue(mockConfig);

		const redis = createRedis();

		expect(getConfigFromEnv).toHaveBeenCalledWith('REDIS');
		expect(Redis).toHaveBeenCalledWith(mockConfig);
		expect(redis).toBe(mockRedis);
	});
});
