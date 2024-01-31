import { expect, test, vi } from 'vitest';
import type { KvConfig } from '../index.js';
import { createKv } from './create.js';
import { KvLocal } from './local.js';
import { KvRedis } from './redis.js';

vi.mock('./local.js');
vi.mock('./redis.js');

test('Creates local kv for type local', () => {
	const config = { type: 'local' } as unknown as KvConfig;

	const kv = createKv(config);
	expect(KvLocal).toHaveBeenCalledWith(config);
	expect(kv).toBeInstanceOf(KvLocal);
});

test('Creates redis kv for type redis', () => {
	const config = { type: 'redis' } as unknown as KvConfig;

	const kv = createKv(config);
	expect(KvRedis).toHaveBeenCalledWith(config);
	expect(kv).toBeInstanceOf(KvRedis);
});

test('Throws an error for unknown types', () => {
	const config = { type: 'WRONG' } as unknown as KvConfig;

	expect(() => createKv(config)).toThrowError();
});
