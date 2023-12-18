import { Redis } from 'ioredis';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { KvRedis, createKv } from '../../kv/index.js';
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
