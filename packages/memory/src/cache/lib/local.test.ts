import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createKv, KvLocal } from '../../kv/index.js';
import { CacheLocal } from './local.js';

vi.mock('../../kv/index.js');
vi.mock('../../utils/index.js');

const mockKey = 'test-key';
const mockValue = 'test-value';
let cache: CacheLocal;

beforeEach(() => {
	vi.mocked(createKv).mockReturnValue(new KvLocal({}));

	cache = new CacheLocal({ maxKeys: 2 });
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('constructor', () => {
	test('Instantiates Kv with configuration', () => {
		expect(createKv).toHaveBeenCalledWith({
			type: 'local',
			maxKeys: 2,
		});

		expect(cache['store']).toBeInstanceOf(KvLocal);
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

describe('clear', () => {
	test('Clears the kv store', async () => {
		await cache.clear();
		expect(cache['store'].clear).toHaveBeenCalled();
	});
});

describe('acquireLock', () => {
	test('Acquires lock from kv store', async () => {
		const mockLock = { release: vi.fn(), extend: vi.fn() };
		vi.mocked(cache['store'].acquireLock).mockResolvedValue(mockLock as any);

		const res = await cache.acquireLock(mockKey);
		expect(cache['store'].acquireLock).toHaveBeenCalledWith(mockKey);
		expect(res).toBe(mockLock);
	});
});

describe('usingLock', () => {
	test('Uses lock from kv store', async () => {
		const mockCallback = vi.fn().mockResolvedValue('result');
		vi.mocked(cache['store'].usingLock).mockResolvedValue('result');

		const res = await cache.usingLock(mockKey, mockCallback);
		expect(cache['store'].usingLock).toHaveBeenCalledWith(mockKey, mockCallback);
		expect(res).toBe('result');
	});
});
