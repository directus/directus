import { Redis } from 'ioredis';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createKv, KvRedis } from '../../kv/index.js';
import { CacheRedis } from './redis.js';

vi.mock('ioredis');
vi.mock('../../kv/index.js');
vi.mock('../../utils/index.js');

const mockKey = 'test-key';
const mockValue = 'test-value';
const mockNamespace = 'test-namespace';

let mockRedis: Redis;
let cache: CacheRedis;

beforeEach(() => {
	vi.mocked(createKv).mockReturnValue(new KvRedis({ namespace: mockNamespace, redis: mockRedis }));

	mockRedis = new Redis();
	cache = new CacheRedis({ namespace: mockNamespace, redis: mockRedis });
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('constructor', () => {
	test('Instantiates Kv with configuration', () => {
		expect(createKv).toHaveBeenCalledWith({
			type: 'redis',
			redis: mockRedis,
			namespace: mockNamespace,
		});

		expect(cache['store']).toBeInstanceOf(KvRedis);
	});
});

describe('get', () => {
	test('Returns result of store get', async () => {
		vi.mocked(cache['store'].get).mockResolvedValue(mockValue);

		const res = await cache.get(mockKey);

		expect(res).toBe(mockValue);
	});
});

describe('set', () => {
	test('Sets the value to the kv store', async () => {
		await cache.set(mockKey, mockValue);

		expect(cache['store'].set).toHaveBeenCalledWith(mockKey, mockValue);
	});
});

describe('delete', () => {
	test('Deletes key from kv store', async () => {
		await cache.delete(mockKey);

		expect(cache['store'].delete).toHaveBeenCalledWith(mockKey);
	});
});

describe('has', () => {
	test('Returns result of kv store has', async () => {
		vi.mocked(cache['store'].has).mockResolvedValue(true);

		const res = await cache.has(mockKey);

		expect(res).toBe(true);
	});
});

describe('clear', () => {
	test('Clears the kv store', async () => {
		await cache.clear();
		expect(cache['store'].clear).toHaveBeenCalled();
	});
});

describe('acquireLock', () => {
	test('Delegates to kv store', async () => {
		const mockLock = { release: vi.fn(), extend: vi.fn() };
		vi.mocked(cache['store'].acquireLock).mockResolvedValue(mockLock as any);

		const result = await cache.acquireLock(mockKey);
		expect(cache['store'].acquireLock).toHaveBeenCalledWith(mockKey);
		expect(result).toBe(mockLock);
	});
});

describe('usingLock', () => {
	test('Delegates to kv store', async () => {
		const mockCallback = vi.fn().mockResolvedValue('result');
		vi.mocked(cache['store'].usingLock).mockResolvedValue('result');

		const result = await cache.usingLock(mockKey, mockCallback);
		expect(cache['store'].usingLock).toHaveBeenCalledWith(mockKey, mockCallback);
		expect(result).toBe('result');
	});
});
