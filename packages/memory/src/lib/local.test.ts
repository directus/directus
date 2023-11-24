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

describe('setMax', () => {
	test('Errors if key does not contain number', async () => {
		const mockKey = 'cache-key';
		const mockValue = 42;
		const mockCached = 'not-a-number';

		memory.get = vi.fn().mockReturnValue(mockCached);

		expect(memory.setMax(mockKey, mockValue)).rejects.toMatchInlineSnapshot(
			'[Error: The value for cache key "cache-key" is not a number.]',
		);
	});

	test('Defaults to 0 if current value does not exist', async () => {
		const mockKey = 'cache-key';
		const mockValue = 42;
		const mockCached = undefined;

		memory.get = vi.fn().mockReturnValue(mockCached);
		memory.set = vi.fn();

		await memory.setMax(mockKey, mockValue);

		expect(memory.set).toHaveBeenCalledWith(mockKey, mockValue);
	});

	test('Returns false if existing value is bigger than passed value', async () => {
		const mockKey = 'cache-key';
		const mockValue = 42;
		const mockCached = 500;

		memory.get = vi.fn().mockReturnValue(mockCached);
		memory.set = vi.fn();

		const result = await memory.setMax(mockKey, mockValue);

		expect(memory.set).not.toHaveBeenCalled();
		expect(result).toBe(false);
	});

	test('Returns true if passed value is bigger than existing value', async () => {
		const mockKey = 'cache-key';
		const mockValue = 500;
		const mockCached = 42;

		memory.get = vi.fn().mockReturnValue(mockCached);
		memory.set = vi.fn();

		const result = await memory.setMax(mockKey, mockValue);

		expect(memory.set).toHaveBeenCalledWith(mockKey, mockValue);
		expect(result).toBe(true);
	});
});

describe('delete', () => {
	test('Deletes key from cache', async () => {
		const mockKey = 'cache-key';

		await memory.delete(mockKey);

		expect(memory['cache'].delete).toHaveBeenCalledWith(mockKey);
	});
});

describe('has', () => {
	test('Returns result of lru has', async () => {
		const mockKey = 'cache-key';

		vi.mocked(memory['cache'].has).mockReturnValue(false);

		const res1 = await memory.has(mockKey);

		expect(memory['cache'].has).toHaveBeenCalledWith(mockKey);
		expect(res1).toBe(false);

		vi.mocked(memory['cache'].has).mockReturnValue(true);

		const res2 = await memory.has(mockKey);

		expect(memory['cache'].has).toHaveBeenCalledWith(mockKey);
		expect(res2).toBe(true);
	});
});

describe('publish', () => {
	test('Is a no-op when no handlers are registered for channel', async () => {
		const mockChannel = 'mock-channel';
		const mockPayload = { hello: 'world' };

		await memory.publish(mockChannel, mockPayload);
	});

	test('Calls each registered callback of the channel with the given payload', async () => {
		const mockChannel = 'mock-channel';
		const mockPayload = { hello: 'world' };
		const mockHandlers = [vi.fn(), vi.fn()];

		memory['handlers'][mockChannel] = new Set(mockHandlers);

		await memory.publish(mockChannel, mockPayload);

		for (const handler of mockHandlers) {
			expect(handler).toBeCalledWith(mockPayload);
		}
	});
});

describe('subscribe', () => {
	test('Creates new set with the passed callback if handler set does not exist yet', async () => {
		const mockChannel = 'mock-channel';
		const mockHandler = vi.fn();

		await memory.subscribe(mockChannel, mockHandler);

		expect(memory['handlers'][mockChannel]).toBeInstanceOf(Set);
		expect(memory['handlers'][mockChannel]?.size).toBe(1);
		expect(memory['handlers'][mockChannel]?.values().next().value).toBe(mockHandler);
	});

	test('Adds callback handler if set already exists', async () => {
		const mockChannel = 'mock-channel';
		const existingHandler = vi.fn();
		const mockHandler = vi.fn();

		memory['handlers'][mockChannel] = new Set([existingHandler]);

		await memory.subscribe(mockChannel, mockHandler);

		expect(memory['handlers'][mockChannel]).toBeInstanceOf(Set);
		expect(memory['handlers'][mockChannel]?.size).toBe(2);

		const handlers = Array.from(memory['handlers'][mockChannel]);
		expect(handlers[0]).toBe(existingHandler);
		expect(handlers[1]).toBe(mockHandler);
	});
});

describe('unsubscribe', () => {
	test('Is a no-op if channel does not exist', async () => {
		const mockChannel = 'mock-channel';
		const mockHandler = vi.fn();

		await memory.unsubscribe(mockChannel, mockHandler);
	});

	test('Removes the handler from the existing', async () => {
		const mockChannel = 'mock-channel';
		const existingHandler = vi.fn();
		const mockHandler = vi.fn();

		memory['handlers'][mockChannel] = new Set([existingHandler, mockHandler]);

		await memory.unsubscribe(mockChannel, mockHandler);

		expect(memory['handlers'][mockChannel]).toBeInstanceOf(Set);
		expect(memory['handlers'][mockChannel]?.size).toBe(1);

		const handlers = Array.from(memory['handlers'][mockChannel]);
		expect(handlers[0]).toBe(existingHandler);
	});
});
