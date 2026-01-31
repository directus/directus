import { Redis } from 'ioredis';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { type BusLocal, createBus } from '../../index.js';
import { CacheLocal } from './local.js';
import { CacheMulti } from './multi.js';
import { CacheRedis } from './redis.js';

vi.mock('../../bus/index.js');
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
const mockLocalValue = 'mock-local-value';
const mockRedisValue = 'mock-redis-value';

const mockBus = {
	subscribe: vi.fn(),
	publish: vi.fn(),
} as unknown as BusLocal;

beforeEach(() => {
	vi.mocked(createBus).mockReturnValue(mockBus as any);

	cache = new CacheMulti({
		local: mockLocalConfig,
		redis: mockRedisConfig,
	});

	vi.mocked(cache['local'].get).mockResolvedValue(mockLocalValue);
	vi.mocked(cache['redis'].get).mockResolvedValue(mockRedisValue);
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('constructor', () => {
	test('Creates local and redis cache handlers', async () => {
		expect(CacheLocal).toBeCalledWith(mockLocalConfig);
		expect(cache['local']).toBeInstanceOf(CacheLocal);

		expect(CacheRedis).toBeCalledWith(mockRedisConfig);
		expect(cache['redis']).toBeInstanceOf(CacheRedis);
	});

	test('Creates a redis bus', () => {
		expect(createBus).toHaveBeenCalledWith({
			type: 'redis',
			redis: mockRedisConfig.redis,
			namespace: mockRedisConfig.namespace,
		});

		// expect(cache['bus']).instanceOf();
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

describe('acquireLock', () => {
	test('Delegates to redis cache', async () => {
		const mockLock = { release: vi.fn(), extend: vi.fn() };
		vi.mocked(cache['redis'].acquireLock).mockResolvedValue(mockLock as any);

		const result = await cache.acquireLock(mockKey);
		expect(cache['redis'].acquireLock).toHaveBeenCalledWith(mockKey);
		expect(result).toBe(mockLock);
	});
});

describe('usingLock', () => {
	test('Delegates to redis cache', async () => {
		const mockCallback = vi.fn().mockResolvedValue('result');
		vi.mocked(cache['redis'].usingLock).mockResolvedValue('result');

		const result = await cache.usingLock(mockKey, mockCallback);
		expect(cache['redis'].usingLock).toHaveBeenCalledWith(mockKey, mockCallback);
		expect(result).toBe('result');
	});
});

describe('clear', () => {
	test('Calls clear for both caches', async () => {
		const result = await cache.clear();
		expect(cache['local'].clear).toHaveBeenCalledOnce();
		expect(cache['redis'].clear).toHaveBeenCalledOnce();
		expect(result).toBeUndefined();
	});
});

describe('onMessageClear', () => {
	test('Ignores messages from self', async () => {
		await cache['onMessageClear']({
			type: 'clear',
			origin: cache['processId'],
		});

		expect(cache['local'].delete).not.toHaveBeenCalled();
		expect(cache['local'].clear).not.toHaveBeenCalled();
	});

	test('Clears specific key if provided in payload', async () => {
		await cache['onMessageClear']({
			type: 'clear',
			origin: 'other-process',
			key: mockKey,
		});

		expect(cache['local'].delete).toHaveBeenCalledWith(mockKey);
		expect(cache['local'].clear).not.toHaveBeenCalled();
	});

	test('Clears all keys if key is undefined', async () => {
		await cache['onMessageClear']({
			type: 'clear',
			origin: 'other-process',
		});

		expect(cache['local'].delete).not.toHaveBeenCalled();
		expect(cache['local'].clear).toHaveBeenCalled();
	});
});
