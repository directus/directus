import { afterEach, describe, expect, test, vi } from 'vitest';
import { KvLocal } from './local.js';

afterEach(() => {
	vi.restoreAllMocks();
	vi.useRealTimers();
});

describe.each([{}, { maxKeys: 100 }, { ttl: 5000 }])('Local KV updates with %j', (config) => {
	test('Retains every concurrent increment and returns distinct counts', async () => {
		const kv = new KvLocal(config);
		const results = await Promise.all(Array.from({ length: 100 }, () => kv.increment('count')));

		expect(results).toEqual(Array.from({ length: 100 }, (_, index) => index + 1));
		expect(await kv.get('count')).toBe(100);
	});

	test('Retains concurrent increments with positive, negative, and zero amounts', async () => {
		const kv = new KvLocal(config);
		await kv.set('count', 10);

		const results = await Promise.all([-3, 5, 0, 2].map((amount) => kv.increment('count', amount)));

		expect(results).toEqual([7, 12, 12, 14]);
		expect(await kv.get('count')).toBe(14);
	});

	test('Rejects smaller and equal concurrent maxima without lowering the stored value', async () => {
		const kv = new KvLocal(config);
		await kv.set('maximum', 1);

		const results = await Promise.all([100, 100, 50].map((value) => kv.setMax('maximum', value)));

		expect(results).toEqual([true, false, false]);
		expect(await kv.get('maximum')).toBe(100);
	});

	test('Accepts successively larger concurrent maxima', async () => {
		const kv = new KvLocal(config);
		const results = await Promise.all([50, 100].map((value) => kv.setMax('maximum', value)));

		expect(results).toEqual([true, true]);
		expect(await kv.get('maximum')).toBe(100);
	});

	test('Shares the latest value between concurrent setMax and increment calls', async () => {
		const kv = new KvLocal(config);
		await kv.set('count', 1);

		expect(await Promise.all([kv.setMax('count', 100), kv.increment('count')])).toEqual([true, 101]);
		expect(await kv.get('count')).toBe(101);

		expect(await Promise.all([kv.increment('count'), kv.setMax('count', 102)])).toEqual([102, false]);
		expect(await kv.get('count')).toBe(102);
	});

	test('Preserves sequential increments and equal-value rejection', async () => {
		const kv = new KvLocal(config);

		expect(await kv.increment('count')).toBe(1);
		expect(await kv.increment('count')).toBe(2);
		expect(await kv.setMax('count', 2)).toBe(false);
		expect(await kv.get('count')).toBe(2);
	});

	test('Rejects non-number values without overwriting them', async () => {
		const kv = new KvLocal(config);
		await kv.set('count', 'not-a-number');

		await expect(kv.increment('count')).rejects.toThrow('The value for key "count" is not a number.');
		await expect(kv.setMax('count', 100)).rejects.toThrow('The value for key "count" is not a number.');
		expect(await kv.get('count')).toBe('not-a-number');
	});
});

test.each(['increment', 'setMax'] as const)('%s preserves TTL renewal and expiration', async (operation) => {
	vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
	const now = vi.spyOn(performance, 'now').mockReturnValue(1000);
	const kv = new KvLocal({ ttl: 1000 });
	await kv.set('count', 1);

	now.mockReturnValue(1500);
	vi.advanceTimersByTime(500);
	await kv[operation]('count', 2);

	now.mockReturnValue(2100);
	vi.advanceTimersByTime(600);
	expect(await kv.has('count')).toBe(true);
	expect(await kv.setMax('count', operation === 'increment' ? 3 : 2)).toBe(false);
	expect(await kv.setMax('count', 1)).toBe(false);

	now.mockReturnValue(2601);
	vi.advanceTimersByTime(501);
	expect(await kv.get('count')).toBeUndefined();
});
