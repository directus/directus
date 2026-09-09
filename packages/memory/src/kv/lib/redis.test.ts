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
import { EPOCH_SCRIPTS, KvRedis, SCRIPTS } from './redis.js';

vi.mock('ioredis');
vi.mock('../../utils/index.js');

let mockNamespace: string;
let mockKey: string;
let mockNamespacedKey: string;
let mockEpochKey: string;
let mockKeyPrefix: string;
let mockRedis: Redis;
let mockUint8Array: Uint8Array;
let mockBuffer: Buffer;
let mockCompressedUint8Array: Uint8Array;
let mockDecompressedUint8Array: Uint8Array;
let mockValue: string;
let kv: KvRedis;
let epochKv: KvRedis;

/** ioredis exposes custom commands as methods, which aren't part of the mocked class */
const stubCustomCommands = (redis: Redis) =>
	Object.assign(redis, {
		setMax: vi.fn(),
		kvGetBuffer: vi.fn(),
		kvExists: vi.fn(),
		kvDelete: vi.fn(),
		kvSet: vi.fn(),
		kvIncrement: vi.fn(),
		kvSetMax: vi.fn(),
		kvBumpEpoch: vi.fn(),
	});

beforeEach(() => {
	mockKey = 'test-key';
	mockNamespace = 'test';
	mockNamespacedKey = 'test:test-key';
	mockEpochKey = 'test:__epoch';
	mockKeyPrefix = 'test:v';

	mockUint8Array = new Uint8Array();
	mockBuffer = Buffer.from(mockUint8Array);
	mockCompressedUint8Array = new Uint8Array([1, 2, 3]);
	mockDecompressedUint8Array = new Uint8Array([1, 2, 3]);

	mockValue = 'test';

	vi.mocked(withNamespace).mockImplementation((key, namespace) => `${namespace}:${key}`);
	vi.mocked(bufferToUint8Array).mockReturnValue(mockUint8Array);
	vi.mocked(uint8ArrayToBuffer).mockReturnValue(mockBuffer as any);
	vi.mocked(compress).mockResolvedValue(mockCompressedUint8Array);
	vi.mocked(decompress).mockResolvedValue(mockDecompressedUint8Array);
	vi.mocked(serialize).mockReturnValue(mockUint8Array);
	vi.mocked(deserialize).mockReturnValue(mockValue);

	mockRedis = new Redis();

	kv = new KvRedis({
		namespace: mockNamespace,
		redis: mockRedis,
		compression: false,
	});

	epochKv = new KvRedis({
		namespace: mockNamespace,
		redis: mockRedis,
		compression: false,
		epoch: true,
	});

	stubCustomCommands(mockRedis);
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

	test('Disables generations by default', () => {
		expect(kv['epoch']).toBe(false);
		expect(epochKv['epoch']).toBe(true);
	});

	test('Derives the generation counter key and key prefix from the namespace', () => {
		expect(epochKv['epochKey']).toBe(mockEpochKey);
		expect(epochKv['keyPrefix']).toBe(mockKeyPrefix);
	});

	test('Defaults compression settings', () => {
		const kv = new KvRedis({
			namespace: mockNamespace,
			redis: mockRedis,
		});

		expect(kv['compression']).toBe(true);
		expect(kv['compressionMinSize']).toBe(1000);
	});

	test('Defines the base commands, and skips the generation commands when disabled', () => {
		const mockRedis = { defineCommand: vi.fn() } as unknown as ExtendedRedis;

		new KvRedis({ redis: mockRedis, namespace: mockNamespace, compression: false });

		for (const [name, lua] of Object.entries(SCRIPTS)) {
			expect(mockRedis.defineCommand).toHaveBeenCalledWith(name, { numberOfKeys: 1, lua });
		}

		expect(mockRedis.defineCommand).toHaveBeenCalledTimes(Object.keys(SCRIPTS).length);
	});

	test('Defines the generation commands when enabled', () => {
		const mockRedis = { defineCommand: vi.fn() } as unknown as ExtendedRedis;

		new KvRedis({ redis: mockRedis, namespace: mockNamespace, compression: false, epoch: true });

		for (const [name, lua] of Object.entries(EPOCH_SCRIPTS)) {
			expect(mockRedis.defineCommand).toHaveBeenCalledWith(name, { numberOfKeys: 1, lua });
		}

		expect(mockRedis.defineCommand).toHaveBeenCalledTimes(
			Object.keys(SCRIPTS).length + Object.keys(EPOCH_SCRIPTS).length,
		);
	});

	test('Skips defining commands if they already exist on redis', () => {
		const mockRedis = { defineCommand: vi.fn() } as unknown as ExtendedRedis;

		for (const name of [...Object.keys(SCRIPTS), ...Object.keys(EPOCH_SCRIPTS)]) {
			(mockRedis as any)[name] = vi.fn();
		}

		new KvRedis({ redis: mockRedis, namespace: mockNamespace, compression: false, epoch: true });

		expect(mockRedis.defineCommand).not.toHaveBeenCalled();
	});
});

describe('get', () => {
	test('Gets namespaced buffer', async () => {
		await kv.get(mockKey);

		expect(withNamespace).toHaveBeenCalledWith(mockKey, mockNamespace);
		expect(kv['redis'].getBuffer).toHaveBeenCalledWith(mockNamespacedKey);
	});

	test('Reads the key from the current generation when enabled', async () => {
		await epochKv.get(mockKey);

		expect(epochKv['redis'].kvGetBuffer).toHaveBeenCalledWith(mockEpochKey, mockKeyPrefix, mockKey);
		expect(epochKv['redis'].getBuffer).not.toHaveBeenCalled();
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
		expect(kv['redis'].set).toHaveBeenCalledWith(mockNamespacedKey, mockValue);
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
		expect(uint8ArrayToBuffer).toHaveBeenCalledWith(mockCompressedUint8Array);
		expect(kv['redis'].set).toHaveBeenCalledWith(mockNamespacedKey, mockBuffer);
	});

	test('Skips compression for values that are too small', async () => {
		kv['compression'] = true;
		kv['compressionMinSize'] = 5;

		await kv.set(mockKey, mockValue);

		expect(serialize).toHaveBeenCalledWith(mockValue);
		expect(compress).not.toHaveBeenCalledWith(mockUint8Array);
		expect(uint8ArrayToBuffer).toHaveBeenCalledWith(mockUint8Array);
		expect(kv['redis'].set).toHaveBeenCalledWith(mockNamespacedKey, mockBuffer);
	});

	test('Custom TTL', async () => {
		const mockValue = 15;
		const mockTTL = 3600000;
		kv['ttl'] = mockTTL;
		await kv.set(mockKey, mockValue);
		expect(kv['redis'].set).toHaveBeenCalledWith(mockNamespacedKey, mockValue, 'PX', mockTTL);
	});

	test('Custom TTL with compression', async () => {
		kv['compression'] = true;
		kv['compressionMinSize'] = 0;
		kv['ttl'] = 3600000;

		await kv.set(mockKey, mockValue);

		expect(kv['redis'].set).toHaveBeenCalledWith(mockNamespacedKey, mockBuffer, 'PX', 3600000);
	});

	test('Writes to the current generation when enabled, passing 0 for an unset TTL', async () => {
		await epochKv.set(mockKey, 15);

		expect(epochKv['redis'].kvSet).toHaveBeenCalledWith(
			mockEpochKey,
			expect.any(Number),
			mockKeyPrefix,
			mockKey,
			15,
			0,
		);

		expect(epochKv['redis'].set).not.toHaveBeenCalled();
	});

	test('Passes the configured TTL to the script when enabled', async () => {
		const mockTTL = 3600000;
		epochKv['ttl'] = mockTTL;

		await epochKv.set(mockKey, 15);

		expect(epochKv['redis'].kvSet).toHaveBeenCalledWith(
			mockEpochKey,
			expect.any(Number),
			mockKeyPrefix,
			mockKey,
			15,
			mockTTL,
		);
	});
});

describe('delete', () => {
	test('Calls Redis unlink for given key', async () => {
		await kv.delete(mockKey);
		expect(withNamespace).toHaveBeenCalledWith(mockKey, mockNamespace);
		expect(kv['redis'].unlink).toHaveBeenCalledWith(mockNamespacedKey);
	});

	test('Unlinks the key in the current generation when enabled', async () => {
		await epochKv.delete(mockKey);

		expect(epochKv['redis'].kvDelete).toHaveBeenCalledWith(mockEpochKey, mockKeyPrefix, mockKey);
		expect(epochKv['redis'].unlink).not.toHaveBeenCalled();
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

	test('Checks the key in the current generation when enabled', async () => {
		vi.mocked(epochKv['redis'].kvExists).mockResolvedValueOnce(1);

		const res = await epochKv.has(mockKey);

		expect(epochKv['redis'].kvExists).toHaveBeenCalledWith(mockEpochKey, mockKeyPrefix, mockKey);
		expect(epochKv['redis'].exists).not.toHaveBeenCalled();
		expect(res).toBe(true);
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
		const mockResult = 42;

		vi.mocked(kv['redis'].incrby).mockResolvedValue(mockResult);

		const res = await kv.increment(mockKey, 15);

		expect(res).toBe(mockResult);
	});

	test('Increments the key in the current generation when enabled', async () => {
		const mockAmount = 15;

		await epochKv.increment(mockKey, mockAmount);

		expect(epochKv['redis'].kvIncrement).toHaveBeenCalledWith(
			mockEpochKey,
			expect.any(Number),
			mockKeyPrefix,
			mockKey,
			mockAmount,
		);

		expect(epochKv['redis'].incrby).not.toHaveBeenCalled();
	});
});

describe('setMax', () => {
	test('Calls custom setMax on Redis instance', async () => {
		const mockAmount = 15;

		await kv.setMax(mockKey, mockAmount);

		expect(withNamespace).toHaveBeenCalledWith(mockKey, mockNamespace);
		expect(kv['redis'].setMax).toHaveBeenCalledWith(mockNamespacedKey, mockAmount);
	});

	test('Returns true if setMax returns 1', async () => {
		vi.mocked(kv['redis'].setMax).mockResolvedValue(1);

		const res = await kv.setMax(mockKey, 15);

		expect(res).toBe(true);
	});

	test('Returns false if setMax returns 0', async () => {
		vi.mocked(kv['redis'].setMax).mockResolvedValue(0);

		const res = await kv.setMax(mockKey, 15);

		expect(res).toBe(false);
	});

	test('Calls the generation-aware script when enabled', async () => {
		const mockAmount = 15;

		await epochKv.setMax(mockKey, mockAmount);

		expect(epochKv['redis'].kvSetMax).toHaveBeenCalledWith(
			mockEpochKey,
			expect.any(Number),
			mockKeyPrefix,
			mockKey,
			mockAmount,
		);

		expect(epochKv['redis'].setMax).not.toHaveBeenCalled();
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

	test('Retires the current generation instead of deleting keys when enabled', async () => {
		epochKv['redis'].scanStream = vi.fn();

		await epochKv.clear();

		expect(epochKv['redis'].kvBumpEpoch).toHaveBeenCalledWith(mockEpochKey, expect.any(Number));
		expect(epochKv['redis'].scanStream).not.toHaveBeenCalled();
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
