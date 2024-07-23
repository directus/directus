import { expect, test, vi } from 'vitest';
import type { LimiterConfig } from '../types/index.js';
import { createLimiter } from './create.js';
import { LimiterLocal } from './local.js';
import { LimiterRedis } from './redis.js';

vi.mock('./local.js');
vi.mock('./redis.js');

test('Creates local cache for type local', () => {
	const config = { type: 'local' } as unknown as LimiterConfig;

	const cache = createLimiter(config);
	expect(LimiterLocal).toHaveBeenCalledWith(config);
	expect(cache).toBeInstanceOf(LimiterLocal);
});

test('Creates redis cache for type redis', () => {
	const config = { type: 'redis' } as unknown as LimiterConfig;

	const cache = createLimiter(config);
	expect(LimiterRedis).toHaveBeenCalledWith(config);
	expect(cache).toBeInstanceOf(LimiterRedis);
});

test('Throws an error for unknown types', () => {
	const config = { type: 'WRONG' } as unknown as LimiterConfig;

	expect(() => createLimiter(config)).toThrowError();
});
