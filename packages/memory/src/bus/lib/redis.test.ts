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
	uint8ArrayToString,
	withNamespace,
} from '../../utils/index.js';
import type { MessageHandler } from '../types/index.js';
import { BusRedis } from './redis.js';

vi.mock('ioredis');
vi.mock('../../utils/index.js');

let mockRedis: Redis;
let mockSubRedis: Redis;
let mockNamespace: string;
let mockChannel: string;
let mockNamespacedChannel: string;
let mockNamespacedChannelBuffer: Buffer;
let mockUint8Array: Uint8Array;
let mockBuffer: Buffer;
let mockCompressedUint8Array: Uint8Array;
let mockDecompressedUint8Array: Uint8Array;
let mockMessage: string;
let mockHandler: MessageHandler;
let bus: BusRedis;

beforeEach(() => {
	mockRedis = new Redis();
	mockSubRedis = new Redis();

	vi.mocked(mockRedis.duplicate).mockReturnValue(mockSubRedis);

	mockNamespace = 'test-namespace';
	mockChannel = 'test-channel';
	mockNamespacedChannel = 'test-namespace:test-channel';
	mockNamespacedChannelBuffer = Buffer.from(mockNamespacedChannel);
	mockMessage = 'test-message';
	mockHandler = vi.fn();

	mockUint8Array = new Uint8Array([1, 2, 3]);
	mockBuffer = Buffer.from(mockUint8Array);
	mockCompressedUint8Array = new Uint8Array([1]);
	mockDecompressedUint8Array = new Uint8Array([1, 2, 3]);

	bus = new BusRedis({
		redis: mockRedis,
		namespace: 'test-namespace',
	});

	vi.mocked(withNamespace).mockReturnValue(mockNamespacedChannel);
	vi.mocked(uint8ArrayToString).mockReturnValue(mockNamespacedChannel);
	vi.mocked(bufferToUint8Array).mockReturnValue(mockUint8Array);
	vi.mocked(uint8ArrayToBuffer).mockReturnValue(mockBuffer);
	vi.mocked(compress).mockResolvedValue(mockCompressedUint8Array);
	vi.mocked(decompress).mockResolvedValue(mockDecompressedUint8Array);
	vi.mocked(serialize).mockReturnValue(mockUint8Array);
	vi.mocked(deserialize).mockReturnValue(mockMessage);
	vi.mocked(isCompressed).mockReturnValue(true);
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('constructor', () => {
	test('Sets internal flags based on config', () => {
		expect(bus['pub']).toBe(mockRedis);
		expect(bus['sub']).toBe(mockSubRedis);
		expect(bus['namespace']).toBe(mockNamespace);
		expect(bus['handlers']).toEqual({});
	});

	test('Defaults compression settings', () => {
		expect(bus['compression']).toBe(true);
		expect(bus['compressionMinSize']).toBe(1000);
	});

	test('Allows setting compression settings', () => {
		const bus = new BusRedis({
			redis: mockRedis,
			namespace: mockNamespace,
			compression: false,
			compressionMinSize: 50,
		});

		expect(bus['compression']).toBe(false);
		expect(bus['compressionMinSize']).toBe(50);
	});

	test('Subscribes to messageBuffers in sub redis', () => {
		expect(bus['sub'].on).toHaveBeenCalledWith('messageBuffer', expect.any(Function));
	});
});

describe('publish', () => {
	test('Publishes binary array for given payload', async () => {
		await bus.publish(mockChannel, mockMessage);

		expect(uint8ArrayToBuffer).toHaveBeenCalledWith(mockUint8Array);
		expect(bus['pub'].publish).toHaveBeenCalledWith(mockNamespacedChannel, mockBuffer);
	});

	test('Skips compression if compression is set to false', async () => {
		bus['compression'] = false;

		await bus.publish(mockChannel, mockMessage);

		expect(uint8ArrayToBuffer).toHaveBeenCalledWith(mockUint8Array);
		expect(bus['pub'].publish).toHaveBeenCalledWith(mockNamespacedChannel, mockBuffer);
	});

	test('Compresses if compression is enabled, and value is larger than min size', async () => {
		bus['compression'] = true;
		bus['compressionMinSize'] = 1;

		await bus.publish(mockChannel, mockMessage);

		expect(compress).toHaveBeenCalledWith(mockUint8Array);
		expect(uint8ArrayToBuffer).toHaveBeenCalledWith(mockCompressedUint8Array);
		expect(bus['pub'].publish).toHaveBeenCalledWith(mockNamespacedChannel, mockBuffer);
	});
});

describe('subscribe', () => {
	test('Subscribes the redis sub to given channel if handlers do not exist yet', async () => {
		await bus.subscribe(mockChannel, mockHandler);
		expect(bus['sub'].subscribe).toHaveBeenCalledWith(mockNamespacedChannel);
	});

	test('Does not call redis subscribe if set already exists', async () => {
		bus['handlers'][mockNamespacedChannel] = new Set([vi.fn()]);
		await bus.subscribe(mockChannel, mockHandler);
		expect(bus['sub'].subscribe).not.toHaveBeenCalledWith();
	});

	test('Saves callback to new handlers set for namespaced channel', async () => {
		await bus.subscribe(mockChannel, mockHandler);
		expect(bus['handlers'][mockNamespacedChannel]).toBeInstanceOf(Set);
		expect(bus['handlers'][mockNamespacedChannel]?.size).toBe(1);
		expect(Array.from(bus['handlers'][mockNamespacedChannel]!)[0]).toBe(mockHandler);
	});

	test('Adds callback to existing handler set', async () => {
		bus['handlers'][mockNamespacedChannel] = new Set([vi.fn()]);
		await bus.subscribe(mockChannel, mockHandler);
		expect(bus['handlers'][mockNamespacedChannel]).toBeInstanceOf(Set);
		expect(bus['handlers'][mockNamespacedChannel]?.size).toBe(2);
		expect(Array.from(bus['handlers'][mockNamespacedChannel]!)[1]).toBe(mockHandler);
	});
});

describe('unsubscribe', () => {
	test('Returns early when no handlers exist for channel', async () => {
		await bus.unsubscribe(mockNamespacedChannel, mockHandler);
		expect(bus['sub'].unsubscribe).not.toHaveBeenCalled();
	});

	test('Deletes given callback from local handler set', async () => {
		const mockHandlerB = vi.fn();
		const existingSet = new Set([mockHandler, mockHandlerB]);
		bus['handlers'][mockNamespacedChannel] = existingSet;
		await bus.unsubscribe(mockChannel, mockHandler);
		expect(bus['handlers'][mockNamespacedChannel]).toEqual(new Set([mockHandlerB]));
		expect(bus['sub'].unsubscribe).not.toHaveBeenCalled();
	});

	test('Deletes set and unsubscribes redis when all handlers are removed', async () => {
		const existingSet = new Set([mockHandler]);
		bus['handlers'][mockNamespacedChannel] = existingSet;
		await bus.unsubscribe(mockChannel, mockHandler);
		expect(bus['handlers'][mockNamespacedChannel]).toBeUndefined();
		expect(bus['sub'].unsubscribe).toHaveBeenCalledWith(mockNamespacedChannel);
	});
});

describe('#messageBufferHandler', () => {
	test('Returns early if no handlers are registered for channel', async () => {
		bus['handlers'] = {};
		await bus['messageBufferHandler'](mockNamespacedChannelBuffer, mockBuffer);

		expect(deserialize).not.toHaveBeenCalled();
	});

	test('Calls all registered handlers for channel with deserialized message', async () => {
		bus['handlers'] = {
			[mockNamespacedChannel]: new Set([mockHandler]),
		};

		await bus['messageBufferHandler'](mockNamespacedChannelBuffer, mockBuffer);

		expect(mockHandler).toHaveBeenCalledWith(mockMessage);
	});

	test('Skips decompression if compression is disabled', async () => {
		bus['handlers'] = {
			[mockNamespacedChannel]: new Set([mockHandler]),
		};

		bus['compression'] = false;

		await bus['messageBufferHandler'](mockNamespacedChannelBuffer, mockBuffer);

		expect(decompress).not.toHaveBeenCalled();
	});

	test('Decompresses binary if value is compressed and compression is enabled', async () => {
		bus['handlers'] = {
			[mockNamespacedChannel]: new Set([mockHandler]),
		};

		bus['compression'] = true;

		await bus['messageBufferHandler'](mockNamespacedChannelBuffer, mockBuffer);

		expect(decompress).toHaveBeenCalledWith(mockUint8Array);
		expect(deserialize).toHaveBeenCalledWith(mockDecompressedUint8Array);
	});
});
