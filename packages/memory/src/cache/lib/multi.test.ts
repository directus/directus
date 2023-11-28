import { Redis } from 'ioredis';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { CacheLocal } from './local.js';
import { CacheMulti } from './multi.js';
import { CacheRedis } from './redis.js';

vi.mock('../../utils/index.js');
vi.mock('./local.js');
vi.mock('./redis.js');
vi.mock('ioredis');

let cache: CacheMulti;

const mockLocalConfig = {
	maxKeys: 5,
};

const mockRedisConfig = {
	namespace: 'test',
	redis: new Redis(),
};

const mockKey = 'mock-key';
const mockValue = 15;
const mockResult = 42;
const mockLocalValue = 'mock-local-value';
const mockRedisValue = 'mock-redis-value';

beforeEach(() => {
	cache = new CacheMulti({
		local: mockLocalConfig,
		redis: mockRedisConfig,
	});

	vi.mocked(cache['local'].get).mockResolvedValue(mockLocalValue);
	vi.mocked(cache['redis'].get).mockResolvedValue(mockRedisValue);
});

describe('constructor', () => {
	test('Creates local and redis cache handlers', async () => {
		expect(CacheLocal).toBeCalledWith(mockLocalConfig);
		expect(cache['local']).toBeInstanceOf(CacheLocal);

		expect(CacheRedis).toBeCalledWith(mockRedisConfig);
		expect(cache['redis']).toBeInstanceOf(CacheRedis);
	});
});

describe('get', () => {
	test('Returns local value if exists', async () => {
		const result = await cache.get(mockKey);
		expect(cache['local'].get).toHaveBeenCalledWith(mockKey);
		expect(result).toBe(mockLocalValue);
	});

	test('Returns redis value if local is undefined', async () => {
		vi.mocked(cache['local'].get).mockResolvedValue(undefined);
		const result = await cache.get(mockKey);
		expect(cache['local'].get).toHaveBeenCalledWith(mockKey);
		expect(cache['redis'].get).toHaveBeenCalledWith(mockKey);
		expect(result).toBe(mockRedisValue);
	});
});

describe('set', () => {
	test('Calls set on both caches in parallel', async () => {
		await cache.set(mockKey, mockValue);
		expect(cache['local'].set).toHaveBeenCalledWith(mockKey, mockValue);
		expect(cache['redis'].set).toHaveBeenCalledWith(mockKey, mockValue);
	});
});

describe('delete', () => {
	test('Calls delete on both caches in parallel', async () => {
		await cache.delete(mockKey);
		expect(cache['local'].delete).toHaveBeenCalledWith(mockKey);
		expect(cache['redis'].delete).toHaveBeenCalledWith(mockKey);
	});
});

describe('has', () => {
	test('Checks if redis has the value cached', async () => {
		vi.mocked(cache['redis'].has).mockResolvedValue(true);
		const result = await cache.has(mockKey);
		expect(cache['redis'].has).toHaveBeenCalledWith(mockKey);
		expect(result).toBe(true);
	});
});

describe('increment', () => {
	test('Increments the value in Redis', async () => {
		await cache.increment(mockKey, mockValue);
		expect(cache['redis'].increment).toHaveBeenCalledWith(mockKey, mockValue);
	});

	test('Sets the local cache to the updated Redis number', async () => {
		vi.mocked(cache['redis'].increment).mockResolvedValue(mockResult);
		await cache.increment(mockKey, mockValue);
		expect(cache['local'].set).toHaveBeenCalledWith(mockKey, mockResult);
	});

	test('Returns the incremented value from Redis', async () => {
		vi.mocked(cache['redis'].increment).mockResolvedValue(mockResult);
		const result = await cache.increment(mockKey, mockValue);
		expect(result).toBe(mockResult);
	});
});

describe('setMax', () => {
	test('Calls redis store setMax', async () => {
		await cache.setMax(mockKey, mockResult);
		expect(cache['redis'].setMax).toHaveBeenCalledWith(mockKey, mockResult);
	});

	test('If max was set, update local cache', async () => {
		vi.mocked(cache['redis'].setMax).mockResolvedValue(true);
		await cache.setMax(mockKey, mockValue);
		expect(cache['local'].set).toHaveBeenCalledWith(mockKey, mockValue);
	});

	test('Returns set status', async () => {
		vi.mocked(cache['redis'].setMax).mockResolvedValue(true);
		const result = await cache.setMax(mockKey, mockValue);
		expect(result).toBe(true);
	});
});
