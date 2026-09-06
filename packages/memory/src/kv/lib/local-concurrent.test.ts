import { describe, expect, test } from 'vitest';
import { KvLocal } from './local.js';

describe('KvLocal concurrent operations', () => {
	test.each([
		{ name: 'Map fallback', config: {} },
		{ name: 'LRU with maxKeys', config: { maxKeys: 100 } },
		{ name: 'LRU with ttl', config: { ttl: 5000 } },
	])('Handles concurrent increments atomically ($name)', async ({ config }) => {
		const kv = new KvLocal(config);

		const concurrency = 100;
		const results = await Promise.all(Array.from({ length: concurrency }, () => kv.increment('counter', 1)));

		const uniqueResults = new Set(results);
		expect(uniqueResults.size).toBe(concurrency);
		expect(await kv.get('counter')).toBe(concurrency);
	});

	test.each([
		{ name: 'Map fallback', config: {} },
		{ name: 'LRU with maxKeys', config: { maxKeys: 100 } },
		{ name: 'LRU with ttl', config: { ttl: 5000 } },
	])('Handles concurrent setMax operations correctly ($name)', async ({ config }) => {
		const kv = new KvLocal(config);
		await kv.set('maximum', 1);

		const results = await Promise.all([kv.setMax('maximum', 100), kv.setMax('maximum', 50)]);

		expect(results).toEqual([true, false]);
		expect(await kv.get('maximum')).toBe(100);
	});
});
