import { describe, expect, test } from 'vitest';
import { collectCache } from './cache.js';

const defaults = {
	CACHE_ENABLED: false,
	CACHE_STORE: 'memory',
};

describe('collectCache', () => {
	test('returns enabled false and memory store by default', () => {
		expect(collectCache({ ...defaults })).toEqual({ enabled: false, store: 'memory' });
	});

	test('returns enabled true when CACHE_ENABLED is true', () => {
		expect(collectCache({ ...defaults, CACHE_ENABLED: true })).toEqual({ enabled: true, store: 'memory' });
	});

	test('returns configured store', () => {
		expect(collectCache({ ...defaults, CACHE_ENABLED: true, CACHE_STORE: 'redis' })).toEqual({
			enabled: true,
			store: 'redis',
		});
	});
});
