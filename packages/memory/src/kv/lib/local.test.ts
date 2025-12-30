import { KvLocal } from './local.js';
import { deserialize, serialize } from '../../utils/index.js';
import { LRUCache } from 'lru-cache';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('lru-cache');
vi.mock('../../utils/index.js');

let kv: KvLocal;

beforeEach(() => {
	kv = new KvLocal({ maxKeys: 2 });

	kv['store'] = {
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

	test('Defaults to JS map if LRU config is not set', () => {
		vi.mocked(LRUCache).mockClear();
		kv = new KvLocal({});
		expect(LRUCache).not.toHaveBeenCalled();
		expect(kv['store']).toBeInstanceOf(Map);
	});
});

describe('get', () => {
	test('Returns undefined if LRU cache is undefined', async () => {
		const mockKey = 'kv-key';

		vi.mocked(kv['store'].get).mockReturnValueOnce(undefined);

		const value = await kv.get(mockKey);

		expect(kv['store'].get).toHaveBeenCalledWith(mockKey);
		expect(value).toBeUndefined();
	});

	test('Returns deserialized value if store contains key', async () => {
		const mockKey = 'kv-key';
		const mockStoredValue = new Uint8Array([1, 2, 3]);
		const mockDeserialized = 'mock-deserialized';

		vi.mocked(kv['store'].get).mockReturnValueOnce(mockStoredValue);
		vi.mocked(deserialize).mockReturnValueOnce(mockDeserialized);

		const value = await kv.get(mockKey);

		expect(kv['store'].get).toHaveBeenCalledWith(mockKey);
		expect(deserialize).toHaveBeenCalledWith(mockStoredValue);
		expect(value).toBe(mockDeserialized);
	});
});

describe('set', () => {
	test('Saves serialized value to store', async () => {
		const mockKey = 'kv-key';
		const mockValue = 'kv-value';
		const mockSerialized = new Uint8Array([1, 2, 3]);

		vi.mocked(serialize).mockReturnValue(mockSerialized);

		await kv.set(mockKey, mockValue);

		expect(serialize).toHaveBeenCalledWith(mockValue);
		expect(kv['store'].set).toHaveBeenCalledWith(mockKey, mockSerialized);
	});
});

describe('increment', () => {
	test('Sets value to 1 if no value exists', async () => {
		const mockKey = 'kv-key';

		kv.get = vi.fn().mockReturnValue(undefined);
		kv.set = vi.fn();

		await kv.increment(mockKey);

		expect(kv.set).toHaveBeenCalledWith(mockKey, 1);
	});

	test('Sets value to passed amount if no value exists', async () => {
		const mockKey = 'kv-key';
		const mockAmount = 15;

		kv.get = vi.fn().mockReturnValue(undefined);
		kv.set = vi.fn();

		await kv.increment(mockKey, mockAmount);

		expect(kv.set).toHaveBeenCalledWith(mockKey, mockAmount);
	});

	test('Sets value to existing + passed amount if no value exists', async () => {
		const mockKey = 'kv-key';
		const mockValue = 42;
		const mockAmount = 15;

		kv.get = vi.fn().mockReturnValue(mockValue);
		kv.set = vi.fn();

		await kv.increment(mockKey, mockAmount);

		expect(kv.set).toHaveBeenCalledWith(mockKey, mockValue + mockAmount);
	});

	test('Errors if key does not contain number', async () => {
		const mockKey = 'kv-key';
		const mockStoredValue = 'not-a-number';

		kv.get = vi.fn().mockReturnValue(mockStoredValue);

		expect(kv.increment(mockKey)).rejects.toMatchInlineSnapshot('[Error: The value for key "kv-key" is not a number.]');
	});
});

describe('setMax', () => {
	test('Errors if key does not contain number', async () => {
		const mockKey = 'kv-key';
		const mockValue = 42;
		const mockStoredValue = 'not-a-number';

		kv.get = vi.fn().mockReturnValue(mockStoredValue);

		expect(kv.setMax(mockKey, mockValue)).rejects.toMatchInlineSnapshot(
			'[Error: The value for key "kv-key" is not a number.]',
		);
	});

	test('Defaults to 0 if current value does not exist', async () => {
		const mockKey = 'kv-key';
		const mockValue = 42;
		const mockStoredValue = undefined;

		kv.get = vi.fn().mockReturnValue(mockStoredValue);
		kv.set = vi.fn();

		await kv.setMax(mockKey, mockValue);

		expect(kv.set).toHaveBeenCalledWith(mockKey, mockValue);
	});

	test('Returns false if existing value is bigger than passed value', async () => {
		const mockKey = 'kv-key';
		const mockValue = 42;
		const mockStoredValue = 500;

		kv.get = vi.fn().mockReturnValue(mockStoredValue);
		kv.set = vi.fn();

		const result = await kv.setMax(mockKey, mockValue);

		expect(kv.set).not.toHaveBeenCalled();
		expect(result).toBe(false);
	});

	test('Returns true if passed value is bigger than existing value', async () => {
		const mockKey = 'kv-key';
		const mockValue = 500;
		const mockStoredValue = 42;

		kv.get = vi.fn().mockReturnValue(mockStoredValue);
		kv.set = vi.fn();

		const result = await kv.setMax(mockKey, mockValue);

		expect(kv.set).toHaveBeenCalledWith(mockKey, mockValue);
		expect(result).toBe(true);
	});
});

describe('delete', () => {
	test('Deletes key from store', async () => {
		const mockKey = 'kv-key';

		await kv.delete(mockKey);

		expect(kv['store'].delete).toHaveBeenCalledWith(mockKey);
	});
});

describe('has', () => {
	test('Returns result of lru has', async () => {
		const mockKey = 'kv-key';

		vi.mocked(kv['store'].has).mockReturnValue(false);

		const res1 = await kv.has(mockKey);

		expect(kv['store'].has).toHaveBeenCalledWith(mockKey);
		expect(res1).toBe(false);

		vi.mocked(kv['store'].has).mockReturnValue(true);

		const res2 = await kv.has(mockKey);

		expect(kv['store'].has).toHaveBeenCalledWith(mockKey);
		expect(res2).toBe(true);
	});
});
