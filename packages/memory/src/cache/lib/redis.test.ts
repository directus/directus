import { Redis } from 'ioredis';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
	bufferToUint8Array,
	compress,
	decompress,
	deserialize,
	serialize,
	uint8ArrayToBuffer,
	withNamespace,
} from '../../utils/index.js';
import { CacheRedis, SET_MAX_SCRIPT } from './redis.js';

vi.mock('ioredis');
vi.mock('../../utils/index.js');

let mockNamespace: string;
let mockKey: string;
let mockNamespacedKey: string;
let mockRedis: Redis;
let mockBuffer: Buffer;
let mockUint8Array: Uint8Array;
let mockCompressedUint8Array: Uint8Array;
let mockDecompressedUint8Array: Uint8Array;
let mockValue: string;
let cache: CacheRedis;

beforeEach(() => {
	mockKey = 'test-key';
	mockNamespace = 'test';
	mockNamespacedKey = 'namespaced:test-key';

	mockBuffer = Buffer.from('test');
	mockUint8Array = new Uint8Array();
	mockCompressedUint8Array = new Uint8Array([1, 2, 3]);
	mockDecompressedUint8Array = new Uint8Array([1, 2, 3]);

	mockValue = 'test';

	mockRedis = new Redis();

	cache = new CacheRedis({
		namespace: mockNamespace,
		redis: mockRedis,
		compression: false,
	});

	vi.mocked(withNamespace).mockReturnValue(mockNamespacedKey);
	vi.mocked(bufferToUint8Array).mockReturnValue(mockUint8Array);
	vi.mocked(uint8ArrayToBuffer).mockReturnValue(mockBuffer);
	vi.mocked(compress).mockResolvedValue(mockCompressedUint8Array);
	vi.mocked(decompress).mockResolvedValue(mockDecompressedUint8Array);
	vi.mocked(serialize).mockReturnValue(mockUint8Array);
	vi.mocked(deserialize).mockReturnValue(mockValue);
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('constructor', () => {
	test('Sets internal flags based on config', () => {
		expect(cache['redis']).toBe(mockRedis);
		expect(cache['namespace']).toBe(mockNamespace);
		expect(cache['compression']).toBe(false);
	});

	test('Defines redis setMax command', () => {
		expect(cache['redis'].defineCommand).toHaveBeenCalledWith('setMax', {
			numberOfKeys: 1,
			lua: SET_MAX_SCRIPT,
		});
	});
});

describe('get', () => {
	test('Gets namespaced buffer', async () => {
		await cache.get(mockKey);

		expect(withNamespace).toHaveBeenCalledWith(mockKey, mockNamespace);
		expect(cache['redis'].getBuffer).toHaveBeenCalledWith(mockNamespacedKey);
	});

	test('Returns undefined for null values from Redis', async () => {
		vi.mocked(cache['redis'].getBuffer).mockResolvedValue(null);

		const result = await cache.get(mockKey);

		expect(result).toBe(undefined);
	});

	test('Returns deserialized buffer', async () => {
		vi.mocked(cache['redis'].getBuffer).mockResolvedValue(mockBuffer);

		const result = await cache.get(mockKey);

		expect(bufferToUint8Array).toHaveBeenCalledWith(mockBuffer);
		expect(deserialize).toHaveBeenCalledWith(mockUint8Array);
		expect(result).toBe(mockValue);
	});

	test('Decompresses value when compress has been set', async () => {
		cache['compression'] = true;

		const result = await cache.get(mockKey);

		expect(bufferToUint8Array).toHaveBeenCalledWith(mockBuffer);
		expect(decompress).toHaveBeenCalledWith(mockUint8Array);
		expect(deserialize).toHaveBeenCalledWith(mockDecompressedUint8Array);
		expect(result).toBe(mockValue);
	});
});

describe('set', () => {
	test('Sets the serialized value as buffer on the namespaced key', async () => {
		await cache.set(mockKey, mockValue);

		expect(serialize).toHaveBeenCalledWith(mockValue);
		expect(withNamespace).toHaveBeenCalledWith(mockKey, mockNamespace);
		expect(uint8ArrayToBuffer).toHaveBeenCalledWith(mockUint8Array);
		expect(cache['redis'].set).toHaveBeenCalledWith(mockNamespacedKey, mockBuffer);
	});

	test('Compresses the value before saving when compression is enabled and value is large enough', async () => {
		cache['compression'] = true;
		cache['compressionMinSize'] = 0;

		await cache.set(mockKey, mockValue);

		expect(serialize).toHaveBeenCalledWith(mockValue);
		expect(compress).toHaveBeenCalledWith(mockUint8Array);
		expect(withNamespace).toHaveBeenCalledWith(mockKey, mockNamespace);
		expect(uint8ArrayToBuffer).toHaveBeenCalledWith(mockCompressedUint8Array);
		expect(cache['redis'].set).toHaveBeenCalledWith(mockNamespacedKey, mockBuffer);
	});

	test('Skips compression for values that are too small', async () => {
		cache['compression'] = true;
		cache['compressionMinSize'] = 5;

		await cache.set(mockKey, mockValue);

		expect(serialize).toHaveBeenCalledWith(mockValue);
		expect(compress).not.toHaveBeenCalledWith(mockUint8Array);
		expect(withNamespace).toHaveBeenCalledWith(mockKey, mockNamespace);
		expect(uint8ArrayToBuffer).toHaveBeenCalledWith(mockUint8Array);
		expect(cache['redis'].set).toHaveBeenCalledWith(mockNamespacedKey, mockBuffer);
	});
});

describe('delete', () => {
	test('Calls Redis unlink for given key', async () => {
		await cache.delete(mockKey);
		expect(withNamespace).toHaveBeenCalledWith(mockKey, mockNamespace);
		expect(cache['redis'].unlink).toHaveBeenCalledWith(mockNamespacedKey);
	});
});

describe('has', () => {
	test('Returns true for exists status 1', async () => {
		vi.mocked(cache['redis'].exists).mockResolvedValueOnce(1);

		const res = await cache.has(mockKey);

		expect(withNamespace).toHaveBeenCalledWith(mockKey, mockNamespace);
		expect(cache['redis'].exists).toHaveBeenCalledWith(mockNamespacedKey);
		expect(res).toBe(true);
	});

	test('Returns true for exists status 1', async () => {
		vi.mocked(cache['redis'].exists).mockResolvedValueOnce(0);

		const res = await cache.has(mockKey);

		expect(withNamespace).toHaveBeenCalledWith(mockKey, mockNamespace);
		expect(cache['redis'].exists).toHaveBeenCalledWith(mockNamespacedKey);
		expect(res).toBe(false);
	});
});

describe('increment', () => {
	test('Calls Redis incrby with given amount', async () => {
		const mockAmount = 15;

		await cache.increment(mockKey, mockAmount);

		expect(withNamespace).toHaveBeenCalledWith(mockKey, mockNamespace);
		expect(cache['redis'].incrby).toHaveBeenCalledWith(mockNamespacedKey, mockAmount);
	});

	test.todo('Returns incremented value from Redis', async () => {
		const mockAmount = 15;
		const mockResult = 42;

		vi.mocked(cache['redis'].incrby).mockResolvedValue(mockResult);

		const res = await cache.increment(mockKey, mockAmount);

		expect(res).toBe(mockResult);
	});
});

describe('setMax', () => {
	test('Calls custom setMax on Redis instance', async () => {
		// ioredis makes custom functions available as methods, but those aren't typeable
		(cache['redis'] as any).setMax = vi.fn();

		const mockAmount = 15;

		await cache.setMax(mockKey, mockAmount);

		expect(withNamespace).toHaveBeenCalledWith(mockKey, mockNamespace);
		expect((cache['redis'] as any).setMax).toHaveBeenCalledWith(mockNamespacedKey, mockAmount);
	});

	test('Returns true if setMax returns 1', async () => {
		// ioredis makes custom functions available as methods, but those aren't typeable
		(cache['redis'] as any).setMax = vi.fn().mockResolvedValue(1);

		const mockAmount = 15;

		const res = await cache.setMax(mockKey, mockAmount);

		expect(res).toBe(true);
	});

	test('Returns false if setMax returns 1', async () => {
		// ioredis makes custom functions available as methods, but those aren't typeable
		(cache['redis'] as any).setMax = vi.fn().mockResolvedValue(0);

		const mockAmount = 15;

		const res = await cache.setMax(mockKey, mockAmount);

		expect(res).toBe(false);
	});
});
