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
