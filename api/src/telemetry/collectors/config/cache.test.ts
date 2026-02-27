import { describe, expect, test } from 'vitest';
import { collectCache } from './cache.js';

describe('collectCache', () => {
	test('returns enabled false and null store by default', () => {
		expect(collectCache({})).toEqual({ enabled: false, store: null });
	});

	test('returns enabled true when CACHE_ENABLED is true', () => {
		expect(collectCache({ CACHE_ENABLED: true })).toEqual({ enabled: true, store: null });
	});

	test('returns configured store', () => {
		expect(collectCache({ CACHE_ENABLED: true, CACHE_STORE: 'redis' })).toEqual({
			enabled: true,
			store: 'redis',
		});
	});
});
