import type { CacheConfig } from '../index.js';
import { createCache } from './create.js';
import { CacheLocal } from './local.js';
import { CacheMulti } from './multi.js';
import { CacheRedis } from './redis.js';
import { expect, test, vi } from 'vitest';

vi.mock('./local.js');
vi.mock('./redis.js');
vi.mock('./multi.js');

test('Creates local cache for type local', () => {
	const config = { type: 'local' } as unknown as CacheConfig;

	const cache = createCache(config);
	expect(CacheLocal).toHaveBeenCalledWith(config);
	expect(cache).toBeInstanceOf(CacheLocal);
});

test('Creates redis cache for type redis', () => {
	const config = { type: 'redis' } as unknown as CacheConfig;

	const cache = createCache(config);
	expect(CacheRedis).toHaveBeenCalledWith(config);
	expect(cache).toBeInstanceOf(CacheRedis);
});

test('Creates multi cache for type multi', () => {
	const config = { type: 'multi' } as unknown as CacheConfig;

	const cache = createCache(config);
	expect(CacheMulti).toHaveBeenCalledWith(config);
	expect(cache).toBeInstanceOf(CacheMulti);
});

test('Throws an error for unknown types', () => {
	const config = { type: 'WRONG' } as unknown as CacheConfig;

	expect(() => createCache(config)).toThrowError();
});
