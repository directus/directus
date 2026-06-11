import { createCache } from '@directus/memory';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { redisConfigAvailable, useRedis } from '../redis/index.js';
import { useStore } from './store.js';

vi.mock('@directus/memory');
vi.mock('../redis/index.js');

const mockCreateCache = vi.mocked(createCache);
const mockRedisConfigAvailable = vi.mocked(redisConfigAvailable);
const mockUseRedis = vi.mocked(useRedis);

describe('useStore', () => {
	let mockStore: any;

	beforeEach(() => {
		mockStore = {
			usingLock: vi.fn(),
			has: vi.fn(),
			get: vi.fn(),
			set: vi.fn(),
			delete: vi.fn(),
		};

		mockCreateCache.mockReturnValue(mockStore);
		mockRedisConfigAvailable.mockReturnValue(true);
		mockUseRedis.mockReturnValue({} as any);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	test('should create local cache when Redis is not available', () => {
		mockRedisConfigAvailable.mockReturnValue(false);

		useStore('test-namespace');

		expect(mockCreateCache).toHaveBeenCalledWith({
			type: 'local',
		});
	});

	test('should create Redis cache when Redis is available', () => {
		const mockRedis = {};
		mockUseRedis.mockReturnValue(mockRedis as any);

		useStore('test-namespace');

		expect(mockCreateCache).toHaveBeenCalledWith({
			type: 'redis',
			namespace: 'test-namespace',
			redis: mockRedis,
		});
	});

	test('should pass ttl to local cache config', () => {
		mockRedisConfigAvailable.mockReturnValue(false);

		useStore('test-namespace', { ttl: 5000 });

		expect(mockCreateCache).toHaveBeenCalledWith({
			type: 'local',
			ttl: 5000,
		});
	});

	test('should pass ttl to redis cache config', () => {
		const mockRedis = {};
		mockUseRedis.mockReturnValue(mockRedis as any);

		useStore('test-namespace', { ttl: 5000 });

		expect(mockCreateCache).toHaveBeenCalledWith({
			type: 'redis',
			namespace: 'test-namespace',
			redis: mockRedis,
			ttl: 5000,
		});
	});

	test('should return a function that executes callback with store interface', async () => {
		const storeFunction = useStore('test-namespace');
		const callback = vi.fn().mockResolvedValue('result');

		mockStore.usingLock.mockImplementation(async (_lockName: any, fn: any) => {
			return await fn();
		});

		const result = await storeFunction(callback);

		expect(mockStore.usingLock).toHaveBeenCalledWith('lock', expect.any(Function));

		expect(callback).toHaveBeenCalledWith({
			has: expect.any(Function),
			get: expect.any(Function),
			set: expect.any(Function),
			delete: expect.any(Function),
		});

		expect(result).toBe('result');
	});

	describe('store interface', () => {
		let storeInterface: any;

		beforeEach(() => {
			const storeFunction = useStore('test-namespace');
			const callback = vi.fn();

			mockStore.usingLock.mockImplementation(async (_lockName: any, fn: any) => {
				await fn();
			});

			storeFunction(callback);
			storeInterface = callback.mock.calls[0]![0];
		});

		test('has method should call store.has with string key', async () => {
			mockStore.has.mockResolvedValue(true);

			const result = await storeInterface.has('testKey');

			expect(mockStore.has).toHaveBeenCalledWith('testKey');
			expect(result).toBe(true);
		});

		test('get method should call store.get with string key and return value', async () => {
			mockStore.get.mockResolvedValue('testValue');

			const result = await storeInterface.get('testKey');

			expect(mockStore.get).toHaveBeenCalledWith('testKey');
			expect(result).toBe('testValue');
		});

		test('get method should return default value when store returns null/undefined', async () => {
			const defaults = { testKey: 'defaultValue' };
			const storeFunction = useStore('test-namespace', { defaults });
			const callback = vi.fn();

			mockStore.usingLock.mockImplementation(async (_lockName: any, fn: any) => {
				await fn();
			});

			mockStore.get.mockResolvedValue(null);

			await storeFunction(callback);
			const storeInterface = callback.mock.calls[0]![0];

			const result = await storeInterface.get('testKey');

			expect(mockStore.get).toHaveBeenCalledWith('testKey');
			expect(result).toBe('defaultValue');
		});

		test('set method should call store.set with string key and value', async () => {
			await storeInterface.set('testKey', 'testValue');

			expect(mockStore.set).toHaveBeenCalledWith('testKey', 'testValue');
		});

		test('delete method should call store.delete with string key', async () => {
			await storeInterface.delete('testKey');

			expect(mockStore.delete).toHaveBeenCalledWith('testKey');
		});
	});

	test('should handle locking mechanism correctly', async () => {
		const storeFunction = useStore('test-namespace');
		const callback = vi.fn().mockResolvedValue('result');

		let lockCallback: any;

		mockStore.usingLock.mockImplementation(async (_lockName: any, fn: any) => {
			lockCallback = fn;
			return await fn();
		});

		await storeFunction(callback);

		expect(mockStore.usingLock).toHaveBeenCalledWith('lock', expect.any(Function));
		expect(typeof lockCallback).toBe('function');
	});

	test('should pass namespace to Redis config', () => {
		const namespace = 'custom-namespace';
		useStore(namespace);

		expect(mockCreateCache).toHaveBeenCalledWith(
			expect.objectContaining({
				namespace,
			}),
		);
	});

	test('should work with empty defaults', () => {
		const storeFunction = useStore('test-namespace', {});

		expect(typeof storeFunction).toBe('function');
	});

	test('should work without defaults', () => {
		const storeFunction = useStore('test-namespace');

		expect(typeof storeFunction).toBe('function');
	});
});
