import { LRUCache } from 'lru-cache';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { deserialize, serialize } from '../utils/serialize.js';
import { MemoryLocal } from './local.js';

vi.mock('lru-cache');
vi.mock('../utils/serialize.js');

let memory: MemoryLocal;

beforeEach(() => {
	memory = new MemoryLocal({ maxKeys: 2 });

	memory['cache'] = {
		get: vi.fn(),
		set: vi.fn(),
		delete: vi.fn(),
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

		vi.mocked(memory['cache'].get).mockReturnValueOnce(undefined);

		const value = await memory.get(mockKey);

		expect(memory['cache'].get).toHaveBeenCalledWith(mockKey);
		expect(value).toBeUndefined();
	});

	test('Returns deserialized value if cache contains key', async () => {
		const mockKey = 'cache-key';
		const mockCached = new Uint8Array([1, 2, 3]);
		const mockDeserialized = 'mock-deserialized';

		vi.mocked(memory['cache'].get).mockReturnValueOnce(mockCached);
		vi.mocked(deserialize).mockReturnValueOnce(mockDeserialized);

		const value = await memory.get(mockKey);

		expect(memory['cache'].get).toHaveBeenCalledWith(mockKey);
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

		await memory.set(mockKey, mockValue);

		expect(serialize).toHaveBeenCalledWith(mockValue);
		expect(memory['cache'].set).toHaveBeenCalledWith(mockKey, mockSerialized);
	});
});

describe('increment', () => {
	test('Sets value to 1 if no value exists', async () => {
		const mockKey = 'cache-key';

		memory.get = vi.fn().mockReturnValue(undefined);
		memory.set = vi.fn();

		await memory.increment(mockKey);

		expect(memory.set).toHaveBeenCalledWith(mockKey, 1);
	});

	test('Sets value to passed amount if no value exists', async () => {
		const mockKey = 'cache-key';
		const mockAmount = 15;

		memory.get = vi.fn().mockReturnValue(undefined);
		memory.set = vi.fn();

		await memory.increment(mockKey, mockAmount);

		expect(memory.set).toHaveBeenCalledWith(mockKey, mockAmount);
	});

	test('Sets value to existing + passed amount if no value exists', async () => {
		const mockKey = 'cache-key';
		const mockValue = 42;
		const mockAmount = 15;

		memory.get = vi.fn().mockReturnValue(mockValue);
		memory.set = vi.fn();

		await memory.increment(mockKey, mockAmount);

		expect(memory.set).toHaveBeenCalledWith(mockKey, mockValue + mockAmount);
	});

	test('Errors if key does not contain number', async () => {
		const mockKey = 'cache-key';
		const mockCached = 'not-a-number';

		memory.get = vi.fn().mockReturnValue(mockCached);

		expect(memory.increment(mockKey)).rejects.toMatchInlineSnapshot(
			'[Error: The value for cache key "cache-key" is not a number.]',
		);
	});
});

describe('delete', () => {
	test('Deletes key from cache', async () => {
		const mockKey = 'cache-key';

		await memory.delete(mockKey);

		expect(memory['cache'].delete).toHaveBeenCalledWith(mockKey);
	});
});
