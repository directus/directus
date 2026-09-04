import { describe, expect, test } from 'vitest';
import { KvLocal } from './local.js';

describe('KvLocal Concurrency', () => {
	test.each([
		{ name: 'Map fallback', config: {} },
		{ name: 'LRU with maxKeys', config: { maxKeys: 100 } },
		{ name: 'LRU with ttl', config: { ttl: 5000 } },
	])('Handles concurrent increments correctly with $name', async ({ config }) => {
		const kv = new KvLocal(config);

		const increments = await Promise.all(Array.from({ length: 100 }, () => kv.increment('count')));

		expect(increments.sort((a, b) => a - b)).toEqual(Array.from({ length: 100 }, (_, i) => i + 1));
		expect(await kv.get('count')).toBe(100);
	});

	test.each([
		{ name: 'Map fallback', config: {} },
		{ name: 'LRU with maxKeys', config: { maxKeys: 100 } },
		{ name: 'LRU with ttl', config: { ttl: 5000 } },
	])('Handles concurrent setMax without overwriting larger value with $name', async ({ config }) => {
		const kv = new KvLocal(config);

		await kv.set('maximum', 1);

		const maxima = await Promise.all([kv.setMax('maximum', 100), kv.setMax('maximum', 50)]);

		expect(maxima).toEqual([true, false]);
		expect(await kv.get('maximum')).toBe(100);
	});

	test('Handles concurrent increment and setMax without race conditions', async () => {
		const kv = new KvLocal({});

		await kv.set('count', 1);

		await Promise.all([kv.setMax('count', 100), kv.increment('count', 1)]);

		const finalVal = await kv.get<number>('count');
		expect([100, 101]).toContain(finalVal);
	});
});
