import { LRUCache } from 'lru-cache';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { deserialize, serialize } from '../../utils/index.js';
import { CacheLocal } from './local.js';

vi.mock('lru-cache');
vi.mock('../../utils/index.js');

let cache: CacheLocal;

beforeEach(() => {
	cache = new CacheLocal({ maxKeys: 2 });

	cache['cache'] = {
		get: vi.fn(),
		set: vi.fn(),
		delete: vi.fn(),
		has: vi.fn(),
	} as unknown as LRUCache<string, Uint8Array, unknown>;
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('constructor', () => {
	test('Instantiates LRU cache with configuration', () => {
		expect(LRUCache).toHaveBeenCalledWith({
			max: 2,
		});
	});
});

describe('get', () => {
	test('Returns undefined if LRU cache is undefined', async () => {
		const mockKey = 'cache-key';

		vi.mocked(cache['cache'].get).mockReturnValueOnce(undefined);

		const value = await cache.get(mockKey);

		expect(cache['cache'].get).toHaveBeenCalledWith(mockKey);
		expect(value).toBeUndefined();
	});

	test('Returns deserialized value if cache contains key', async () => {
		const mockKey = 'cache-key';
		const mockCached = new Uint8Array([1, 2, 3]);
		const mockDeserialized = 'mock-deserialized';

		vi.mocked(cache['cache'].get).mockReturnValueOnce(mockCached);
		vi.mocked(deserialize).mockReturnValueOnce(mockDeserialized);

		const value = await cache.get(mockKey);

		expect(cache['cache'].get).toHaveBeenCalledWith(mockKey);
		expect(deserialize).toHaveBeenCalledWith(mockCached);
		expect(value).toBe(mockDeserialized);
	});
});

describe('set', () => {
	test('Saves serialized value to cache', async () => {
		const mockKey = 'cache-key';
		const mockValue = 'cache-value';
		const mockSerialized = new Uint8Array([1, 2, 3]);

		vi.mocked(serialize).mockReturnValue(mockSerialized);

		await cache.set(mockKey, mockValue);

		expect(serialize).toHaveBeenCalledWith(mockValue);
		expect(cache['cache'].set).toHaveBeenCalledWith(mockKey, mockSerialized);
	});
});

describe('increment', () => {
	test('Sets value to 1 if no value exists', async () => {
		const mockKey = 'cache-key';

		cache.get = vi.fn().mockReturnValue(undefined);
		cache.set = vi.fn();

		await cache.increment(mockKey);

		expect(cache.set).toHaveBeenCalledWith(mockKey, 1);
	});

	test('Sets value to passed amount if no value exists', async () => {
		const mockKey = 'cache-key';
		const mockAmount = 15;

		cache.get = vi.fn().mockReturnValue(undefined);
		cache.set = vi.fn();

		await cache.increment(mockKey, mockAmount);

		expect(cache.set).toHaveBeenCalledWith(mockKey, mockAmount);
	});

	test('Sets value to existing + passed amount if no value exists', async () => {
		const mockKey = 'cache-key';
		const mockValue = 42;
		const mockAmount = 15;

		cache.get = vi.fn().mockReturnValue(mockValue);
		cache.set = vi.fn();

		await cache.increment(mockKey, mockAmount);

		expect(cache.set).toHaveBeenCalledWith(mockKey, mockValue + mockAmount);
	});

	test('Errors if key does not contain number', async () => {
		const mockKey = 'cache-key';
		const mockCached = 'not-a-number';

		cache.get = vi.fn().mockReturnValue(mockCached);

		expect(cache.increment(mockKey)).rejects.toMatchInlineSnapshot(
			'[Error: The value for cache key "cache-key" is not a number.]',
		);
	});
});

describe('setMax', () => {
	test('Errors if key does not contain number', async () => {
		const mockKey = 'cache-key';
		const mockValue = 42;
		const mockCached = 'not-a-number';

		cache.get = vi.fn().mockReturnValue(mockCached);

		expect(cache.setMax(mockKey, mockValue)).rejects.toMatchInlineSnapshot(
			'[Error: The value for cache key "cache-key" is not a number.]',
		);
	});

	test('Defaults to 0 if current value does not exist', async () => {
		const mockKey = 'cache-key';
		const mockValue = 42;
		const mockCached = undefined;

		cache.get = vi.fn().mockReturnValue(mockCached);
		cache.set = vi.fn();

		await cache.setMax(mockKey, mockValue);

		expect(cache.set).toHaveBeenCalledWith(mockKey, mockValue);
	});

	test('Returns false if existing value is bigger than passed value', async () => {
		const mockKey = 'cache-key';
		const mockValue = 42;
		const mockCached = 500;

		cache.get = vi.fn().mockReturnValue(mockCached);
		cache.set = vi.fn();

		const result = await cache.setMax(mockKey, mockValue);

		expect(cache.set).not.toHaveBeenCalled();
		expect(result).toBe(false);
	});

	test('Returns true if passed value is bigger than existing value', async () => {
		const mockKey = 'cache-key';
		const mockValue = 500;
		const mockCached = 42;

		cache.get = vi.fn().mockReturnValue(mockCached);
		cache.set = vi.fn();

		const result = await cache.setMax(mockKey, mockValue);

		expect(cache.set).toHaveBeenCalledWith(mockKey, mockValue);
		expect(result).toBe(true);
	});
});

describe('delete', () => {
	test('Deletes key from cache', async () => {
		const mockKey = 'cache-key';

		await cache.delete(mockKey);

		expect(cache['cache'].delete).toHaveBeenCalledWith(mockKey);
	});
});

describe('has', () => {
	test('Returns result of lru has', async () => {
		const mockKey = 'cache-key';

		vi.mocked(cache['cache'].has).mockReturnValue(false);

		const res1 = await cache.has(mockKey);

		expect(cache['cache'].has).toHaveBeenCalledWith(mockKey);
		expect(res1).toBe(false);

		vi.mocked(cache['cache'].has).mockReturnValue(true);

		const res2 = await cache.has(mockKey);

		expect(cache['cache'].has).toHaveBeenCalledWith(mockKey);
		expect(res2).toBe(true);
	});
});
