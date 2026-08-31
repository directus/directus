import { describe, expect, test } from 'vitest';
import { collectCache } from './cache.js';

const defaults = {
	CACHE_ENABLED: false,
	CACHE_STORE: 'memory',
};

describe('collectCache', () => {
	test('returns enabled false and memory store by default', () => {
		expect(collectCache({ ...defaults })).toEqual({ enabled: false, store: 'memory', schema_freeze: false });
	});

	test('returns enabled true when CACHE_ENABLED is true', () => {
		expect(collectCache({ ...defaults, CACHE_ENABLED: true })).toEqual({
			enabled: true,
			store: 'memory',
			schema_freeze: false,
		});
	});

	test('reports schema freeze when enabled', () => {
		expect(collectCache({ ...defaults, CACHE_SCHEMA_FREEZE_ENABLED: true }).schema_freeze).toBe(true);
	});

	test('returns configured store', () => {
		expect(collectCache({ ...defaults, CACHE_ENABLED: true, CACHE_STORE: 'redis' })).toEqual({
			enabled: true,
			store: 'redis',
			schema_freeze: false,
		});
	});
});
