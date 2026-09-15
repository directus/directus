import { Redis } from 'ioredis';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
	bufferToUint8Array,
	compress,
	decompress,
	deserialize,
	isCompressed,
	serialize,
	uint8ArrayToBuffer,
	withNamespace,
} from '../../utils/index.js';
import type { ExtendedRedis } from '../index.js';
import { KvRedis, SET_MAX_FIELD_SCRIPT, SET_MAX_SCRIPT } from './redis.js';

vi.mock('ioredis');
vi.mock('../../utils/index.js');

let mockNamespace: string;
let mockKey: string;
let mockNamespacedKey: string;
let mockRedis: Redis;
let mockUint8Array: Uint8Array;
let mockBuffer: Buffer;
let mockCompressedUint8Array: Uint8Array;
let mockDecompressedUint8Array: Uint8Array;
let mockValue: string;
let kv: KvRedis;

/**
 * `multi` returns a chainable builder, so stub out the commands used by the hash write paths and
 * report back what was queued on it
 */
const mockMulti = (kv: KvRedis) => {
	const chain = {
		hset: vi.fn(() => chain),
		hincrby: vi.fn(() => chain),
		pexpire: vi.fn(() => chain),
		exec: vi.fn().mockResolvedValue([]),
	};

	kv['redis'].multi = vi.fn().mockReturnValue(chain) as any;

	return chain;
};

beforeEach(() => {
	mockKey = 'test-key';
	mockNamespace = 'test';
	mockNamespacedKey = 'namespaced:test-key';

	mockUint8Array = new Uint8Array();
	mockBuffer = Buffer.from(mockUint8Array);
	mockCompressedUint8Array = new Uint8Array([1, 2, 3]);
	mockDecompressedUint8Array = new Uint8Array([1, 2, 3]);

	mockValue = 'test';

	mockRedis = new Redis();

	kv = new KvRedis({
		namespace: mockNamespace,
		redis: mockRedis,
		compression: false,
	});

	vi.mocked(withNamespace).mockReturnValue(mockNamespacedKey);
	vi.mocked(bufferToUint8Array).mockReturnValue(mockUint8Array);
	vi.mocked(uint8ArrayToBuffer).mockReturnValue(mockBuffer as any);
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
		expect(kv['redis']).toBe(mockRedis);
		expect(kv['namespace']).toBe(mockNamespace);
		expect(kv['compression']).toBe(false);
	});

	test('Defaults compression settings', () => {
		const kv = new KvRedis({
			namespace: mockNamespace,
			redis: mockRedis,
		});

		expect(kv['compression']).toBe(true);
		expect(kv['compressionMinSize']).toBe(1000);
	});

	test('Defaults the hash layout to disabled', () => {
		expect(kv['hash']).toBe(false);
	});

	test('Enables the hash layout when configured', () => {
		const kv = new KvRedis({
			namespace: mockNamespace,
			redis: mockRedis,
			hash: true,
		});

		expect(kv['hash']).toBe(true);
	});

	test('Defines redis setMax command if it does not exist yet', () => {
		expect(kv['redis'].defineCommand).toHaveBeenCalledWith('setMax', {
			numberOfKeys: 1,
			lua: SET_MAX_SCRIPT,
		});

		expect(kv['redis'].defineCommand).toHaveBeenCalledWith('setMaxField', {
			numberOfKeys: 1,
			lua: SET_MAX_FIELD_SCRIPT,
		});

		expect(kv['redis'].defineCommand).toHaveBeenCalledWith('release', {
			numberOfKeys: 1,
			lua: expect.any(String),
		});
	});

	test('Skips defining commands if they already exist on redis', () => {
		const mockRedis = {
			defineCommand: vi.fn(),
			setMax: vi.fn(),
			setMaxField: vi.fn(),
			release: vi.fn(),
		} as unknown as ExtendedRedis;

		new KvRedis({ redis: mockRedis, namespace: mockNamespace, compression: false });

		expect(mockRedis.defineCommand).not.toHaveBeenCalled();
	});
});

describe('get', () => {
	test('Gets namespaced buffer', async () => {
		await kv.get(mockKey);

		expect(withNamespace).toHaveBeenCalledWith(mockKey, mockNamespace);
		expect(kv['redis'].getBuffer).toHaveBeenCalledWith(mockNamespacedKey);
	});

	test('Returns undefined for null values from Redis', async () => {
		vi.mocked(kv['redis'].getBuffer).mockResolvedValue(null);

		const result = await kv.get(mockKey);

		expect(result).toBe(undefined);
	});

	test('Returns deserialized buffer', async () => {
		vi.mocked(kv['redis'].getBuffer).mockResolvedValue(mockBuffer);

		const result = await kv.get(mockKey);

		expect(bufferToUint8Array).toHaveBeenCalledWith(mockBuffer);
		expect(deserialize).toHaveBeenCalledWith(mockUint8Array);
		expect(result).toBe(mockValue);
	});

	test('Decompresses value when compress has been set and value is gzip compressed', async () => {
		kv['compression'] = true;

		vi.mocked(kv['redis'].getBuffer).mockResolvedValue(mockBuffer);

		vi.mocked(isCompressed).mockReturnValue(true);

		const result = await kv.get(mockKey);

		expect(bufferToUint8Array).toHaveBeenCalledWith(mockBuffer);
		expect(decompress).toHaveBeenCalledWith(mockUint8Array);
		expect(deserialize).toHaveBeenCalledWith(mockDecompressedUint8Array);
		expect(result).toBe(mockValue);
	});

	test('Skips decompression if compression is enabled but value is not compressed', async () => {
		kv['compression'] = true;

		vi.mocked(kv['redis'].getBuffer).mockResolvedValue(mockBuffer);

		vi.mocked(isCompressed).mockReturnValue(false);

		const result = await kv.get(mockKey);

		expect(bufferToUint8Array).toHaveBeenCalledWith(mockBuffer);
		expect(decompress).not.toHaveBeenCalledWith(mockUint8Array);
		expect(deserialize).toHaveBeenCalledWith(mockUint8Array);
		expect(result).toBe(mockValue);
	});
});

describe('set', () => {
	test('Saves numeric values as-is', async () => {
		const mockValue = 15;

		await kv.set(mockKey, mockValue);

		expect(withNamespace).toHaveBeenCalledWith(mockKey, mockNamespace);
		expect(kv['redis'].set).toHaveBeenCalledWith(mockNamespacedKey, '15');
	});

	test('Sets the serialized value as buffer on the namespaced key', async () => {
		await kv.set(mockKey, mockValue);

		expect(serialize).toHaveBeenCalledWith(mockValue);
		expect(withNamespace).toHaveBeenCalledWith(mockKey, mockNamespace);
		expect(uint8ArrayToBuffer).toHaveBeenCalledWith(mockUint8Array);
		expect(kv['redis'].set).toHaveBeenCalledWith(mockNamespacedKey, mockBuffer);
	});

	test('Compresses the value before saving when compression is enabled and value is large enough', async () => {
		kv['compression'] = true;
		kv['compressionMinSize'] = 0;

		await kv.set(mockKey, mockValue);

		expect(serialize).toHaveBeenCalledWith(mockValue);
		expect(compress).toHaveBeenCalledWith(mockUint8Array);
		expect(withNamespace).toHaveBeenCalledWith(mockKey, mockNamespace);
		expect(uint8ArrayToBuffer).toHaveBeenCalledWith(mockCompressedUint8Array);
		expect(kv['redis'].set).toHaveBeenCalledWith(mockNamespacedKey, mockBuffer);
	});

	test('Skips compression for values that are too small', async () => {
		kv['compression'] = true;
		kv['compressionMinSize'] = 5;

		await kv.set(mockKey, mockValue);

		expect(serialize).toHaveBeenCalledWith(mockValue);
		expect(compress).not.toHaveBeenCalledWith(mockUint8Array);
		expect(withNamespace).toHaveBeenCalledWith(mockKey, mockNamespace);
		expect(uint8ArrayToBuffer).toHaveBeenCalledWith(mockUint8Array);
		expect(kv['redis'].set).toHaveBeenCalledWith(mockNamespacedKey, mockBuffer);
	});

	test('Custom TTL', async () => {
		const mockValue = 15;
		const mockTTL = 3600000;
		kv['ttl'] = mockTTL;
		await kv.set(mockKey, mockValue);
		expect(kv['redis'].set).toHaveBeenCalledWith(mockNamespacedKey, '15', 'PX', mockTTL);
	});

	test('Custom TTL with compression', async () => {
		kv['compression'] = true;
		kv['compressionMinSize'] = 0;
		kv['ttl'] = 3600000;

		await kv.set(mockKey, mockValue);

		expect(kv['redis'].set).toHaveBeenCalledWith(mockNamespacedKey, mockBuffer, 'PX', 3600000);
	});
});

describe('delete', () => {
	test('Calls Redis unlink for given key', async () => {
		await kv.delete(mockKey);
		expect(withNamespace).toHaveBeenCalledWith(mockKey, mockNamespace);
		expect(kv['redis'].unlink).toHaveBeenCalledWith(mockNamespacedKey);
	});
});

describe('has', () => {
	test('Returns true for exists status 1', async () => {
		vi.mocked(kv['redis'].exists).mockResolvedValueOnce(1);

		const res = await kv.has(mockKey);

		expect(withNamespace).toHaveBeenCalledWith(mockKey, mockNamespace);
		expect(kv['redis'].exists).toHaveBeenCalledWith(mockNamespacedKey);
		expect(res).toBe(true);
	});

	test('Returns false for exists status 0', async () => {
		vi.mocked(kv['redis'].exists).mockResolvedValueOnce(0);

		const res = await kv.has(mockKey);

		expect(withNamespace).toHaveBeenCalledWith(mockKey, mockNamespace);
		expect(kv['redis'].exists).toHaveBeenCalledWith(mockNamespacedKey);
		expect(res).toBe(false);
	});
});

describe('increment', () => {
	test('Calls Redis incrby with given amount', async () => {
		const mockAmount = 15;

		await kv.increment(mockKey, mockAmount);

		expect(withNamespace).toHaveBeenCalledWith(mockKey, mockNamespace);
		expect(kv['redis'].incrby).toHaveBeenCalledWith(mockNamespacedKey, mockAmount);
	});

	test('Returns incremented value from Redis', async () => {
		const mockAmount = 15;
		const mockResult = 42;

		vi.mocked(kv['redis'].incrby).mockResolvedValue(mockResult);

		const res = await kv.increment(mockKey, mockAmount);

		expect(res).toBe(mockResult);
	});
});

describe('setMax', () => {
	test('Calls custom setMax on Redis instance', async () => {
		// ioredis makes custom functions available as methods, but those aren't typeable
		(kv['redis'] as any).setMax = vi.fn();

		const mockAmount = 15;

		await kv.setMax(mockKey, mockAmount);

		expect(withNamespace).toHaveBeenCalledWith(mockKey, mockNamespace);
		expect((kv['redis'] as any).setMax).toHaveBeenCalledWith(mockNamespacedKey, mockAmount);
	});

	test('Returns true if setMax returns 1', async () => {
		// ioredis makes custom functions available as methods, but those aren't typeable
		(kv['redis'] as any).setMax = vi.fn().mockResolvedValue(1);

		const mockAmount = 15;

		const res = await kv.setMax(mockKey, mockAmount);

		expect(res).toBe(true);
	});

	test('Returns false if setMax returns 0', async () => {
		// ioredis makes custom functions available as methods, but those aren't typeable
		(kv['redis'] as any).setMax = vi.fn().mockResolvedValue(0);

		const mockAmount = 15;

		const res = await kv.setMax(mockKey, mockAmount);

		expect(res).toBe(false);
	});
});

describe('clear', () => {
	test('Uses stream for iterating over keys, unlinks them in a pipeline', async () => {
		kv['redis'].scanStream = vi.fn().mockReturnValue({
			async *[Symbol.asyncIterator]() {
				yield [mockKey];
				yield [mockKey];
			},
		});

		const unlinkFn = vi.fn();
		const execFn = vi.fn();

		kv['redis'].pipeline = vi.fn().mockReturnValue({
			unlink: unlinkFn,
			exec: execFn,
		});

		await kv.clear();

		expect(kv['redis'].pipeline).toHaveBeenCalledOnce();
		expect(withNamespace).toHaveBeenCalledWith('*', mockNamespace);
		expect(unlinkFn).toHaveBeenCalledTimes(2); // See the mocked key chunks from `scanStream`
		expect(execFn).toHaveBeenCalledOnce();
	});
});

describe('acquireLock', () => {
	test('Delegates to redlock acquire and awaits', async () => {
		let innerReleased = false;
		let innerExtended = false;

		const mockLock = {
			release: vi.fn().mockImplementation(async () => {
				await new Promise((resolve) => setTimeout(resolve, 10));
				innerReleased = true;
			}),
			extend: vi.fn().mockImplementation(async () => {
				await new Promise((resolve) => setTimeout(resolve, 10));
				innerExtended = true;
			}),
		};

		kv['redlock'].acquire = vi.fn().mockResolvedValue(mockLock);

		const lock = await kv.acquireLock(mockKey);
		expect(kv['redlock'].acquire).toHaveBeenCalledWith([mockNamespacedKey], 5000);

		await lock.release();
		expect(innerReleased).toBe(true);

		await lock.extend(100);
		expect(innerExtended).toBe(true);
	});
});

describe('usingLock', () => {
	test('Delegates to redlock using', async () => {
		const callback = vi.fn();
		kv['redlock'].using = vi.fn();

		await kv.usingLock(mockKey, callback);
		expect(kv['redlock'].using).toHaveBeenCalledWith([mockNamespacedKey], 5000, callback);
	});
});

describe('hash layout enabled', () => {
	let hashKv: KvRedis;

	beforeEach(() => {
		hashKv = new KvRedis({
			namespace: mockNamespace,
			redis: mockRedis,
			compression: false,
			hash: true,
		});
	});

	describe('get', () => {
		test('Reads the field off the namespace hash', async () => {
			await hashKv.get(mockKey);

			expect(hashKv['redis'].hgetBuffer).toHaveBeenCalledWith(mockNamespace, mockKey);
			expect(hashKv['redis'].getBuffer).not.toHaveBeenCalled();
		});

		test('Returns undefined for null values from Redis', async () => {
			vi.mocked(hashKv['redis'].hgetBuffer).mockResolvedValue(null);

			expect(await hashKv.get(mockKey)).toBe(undefined);
		});

		test('Returns deserialized buffer', async () => {
			vi.mocked(hashKv['redis'].hgetBuffer).mockResolvedValue(mockBuffer);

			const result = await hashKv.get(mockKey);

			expect(bufferToUint8Array).toHaveBeenCalledWith(mockBuffer);
			expect(deserialize).toHaveBeenCalledWith(mockUint8Array);
			expect(result).toBe(mockValue);
		});

		test('Decompresses value when compress has been set and value is gzip compressed', async () => {
			hashKv['compression'] = true;

			vi.mocked(hashKv['redis'].hgetBuffer).mockResolvedValue(mockBuffer);
			vi.mocked(isCompressed).mockReturnValue(true);

			const result = await hashKv.get(mockKey);

			expect(decompress).toHaveBeenCalledWith(mockUint8Array);
			expect(deserialize).toHaveBeenCalledWith(mockDecompressedUint8Array);
			expect(result).toBe(mockValue);
		});
	});

	describe('set', () => {
		test('Saves numeric values as-is', async () => {
			await hashKv.set(mockKey, 15);

			expect(serialize).not.toHaveBeenCalled();
			expect(hashKv['redis'].hset).toHaveBeenCalledWith(mockNamespace, mockKey, '15');
		});

		test('Sets the serialized value as buffer as a field on the namespace hash', async () => {
			await hashKv.set(mockKey, mockValue);

			expect(serialize).toHaveBeenCalledWith(mockValue);
			expect(uint8ArrayToBuffer).toHaveBeenCalledWith(mockUint8Array);
			expect(hashKv['redis'].hset).toHaveBeenCalledWith(mockNamespace, mockKey, mockBuffer);
			expect(hashKv['redis'].set).not.toHaveBeenCalled();
		});

		test('Compresses the value before saving when compression is enabled and value is large enough', async () => {
			hashKv['compression'] = true;
			hashKv['compressionMinSize'] = 0;

			await hashKv.set(mockKey, mockValue);

			expect(compress).toHaveBeenCalledWith(mockUint8Array);
			expect(uint8ArrayToBuffer).toHaveBeenCalledWith(mockCompressedUint8Array);
			expect(hashKv['redis'].hset).toHaveBeenCalledWith(mockNamespace, mockKey, mockBuffer);
		});

		test('Custom TTL refreshes the expiry of the namespace hash', async () => {
			const mockTTL = 3600000;
			hashKv['ttl'] = mockTTL;

			const multi = mockMulti(hashKv);

			await hashKv.set(mockKey, 15);

			expect(multi.hset).toHaveBeenCalledWith(mockNamespace, mockKey, '15');
			expect(multi.pexpire).toHaveBeenCalledWith(mockNamespace, mockTTL);
			expect(multi.exec).toHaveBeenCalledOnce();
		});

		test('Custom TTL with compression', async () => {
			hashKv['compression'] = true;
			hashKv['compressionMinSize'] = 0;
			hashKv['ttl'] = 3600000;

			const multi = mockMulti(hashKv);

			await hashKv.set(mockKey, mockValue);

			expect(multi.hset).toHaveBeenCalledWith(mockNamespace, mockKey, mockBuffer);
			expect(multi.pexpire).toHaveBeenCalledWith(mockNamespace, 3600000);
		});
	});

	describe('delete', () => {
		test('Removes the field from the namespace hash', async () => {
			await hashKv.delete(mockKey);

			expect(hashKv['redis'].hdel).toHaveBeenCalledWith(mockNamespace, mockKey);
			expect(hashKv['redis'].unlink).not.toHaveBeenCalled();
		});
	});

	describe('has', () => {
		test('Returns true for hexists status 1', async () => {
			vi.mocked(hashKv['redis'].hexists).mockResolvedValueOnce(1);

			const res = await hashKv.has(mockKey);

			expect(hashKv['redis'].hexists).toHaveBeenCalledWith(mockNamespace, mockKey);
			expect(res).toBe(true);
		});

		test('Returns false for hexists status 0', async () => {
			vi.mocked(hashKv['redis'].hexists).mockResolvedValueOnce(0);

			expect(await hashKv.has(mockKey)).toBe(false);
		});
	});

	describe('increment', () => {
		test('Calls Redis hincrby with given amount', async () => {
			vi.mocked(hashKv['redis'].hincrby).mockResolvedValue(42);

			const res = await hashKv.increment(mockKey, 15);

			expect(hashKv['redis'].hincrby).toHaveBeenCalledWith(mockNamespace, mockKey, 15);
			expect(hashKv['redis'].incrby).not.toHaveBeenCalled();
			expect(res).toBe(42);
		});

		test('Refreshes the expiry of the namespace hash when a TTL is configured', async () => {
			hashKv['ttl'] = 3600000;

			const multi = mockMulti(hashKv);
			multi.exec.mockResolvedValue([[null, 42]]);

			const res = await hashKv.increment(mockKey, 15);

			expect(multi.hincrby).toHaveBeenCalledWith(mockNamespace, mockKey, 15);
			expect(multi.pexpire).toHaveBeenCalledWith(mockNamespace, 3600000);
			expect(res).toBe(42);
		});
	});

	describe('setMax', () => {
		test('Calls custom setMaxField on Redis instance', async () => {
			// ioredis makes custom functions available as methods, but those aren't typeable
			(hashKv['redis'] as any).setMaxField = vi.fn();

			await hashKv.setMax(mockKey, 15);

			expect((hashKv['redis'] as any).setMaxField).toHaveBeenCalledWith(mockNamespace, mockKey, 15, 0);
		});

		test('Passes the configured TTL along to the script', async () => {
			// ioredis makes custom functions available as methods, but those aren't typeable
			(hashKv['redis'] as any).setMaxField = vi.fn();

			hashKv['ttl'] = 3600000;

			await hashKv.setMax(mockKey, 15);

			expect((hashKv['redis'] as any).setMaxField).toHaveBeenCalledWith(mockNamespace, mockKey, 15, 3600000);
		});

		test('Returns whether the script reported a write', async () => {
			// ioredis makes custom functions available as methods, but those aren't typeable
			(hashKv['redis'] as any).setMaxField = vi.fn().mockResolvedValue(1);
			expect(await hashKv.setMax(mockKey, 15)).toBe(true);

			(hashKv['redis'] as any).setMaxField = vi.fn().mockResolvedValue(0);
			expect(await hashKv.setMax(mockKey, 15)).toBe(false);
		});
	});

	describe('clear', () => {
		test('Unlinks the namespace hash in a single call, without scanning the keyspace', async () => {
			hashKv['redis'].scanStream = vi.fn();
			hashKv['redis'].pipeline = vi.fn();

			await hashKv.clear();

			expect(hashKv['redis'].unlink).toHaveBeenCalledWith(mockNamespace);
			expect(hashKv['redis'].unlink).toHaveBeenCalledOnce();
			expect(hashKv['redis'].scanStream).not.toHaveBeenCalled();
			expect(hashKv['redis'].pipeline).not.toHaveBeenCalled();
		});
	});

	describe('locks', () => {
		test('Keeps using namespaced keys, as those can not live in a hash', async () => {
			hashKv['redlock'].using = vi.fn();

			const callback = vi.fn();
			await hashKv.usingLock(mockKey, callback);

			expect(withNamespace).toHaveBeenCalledWith(mockKey, mockNamespace);
			expect(hashKv['redlock'].using).toHaveBeenCalledWith([mockNamespacedKey], 5000, callback);
		});
	});
});
