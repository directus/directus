import { describe, expect, test } from 'vitest';
import { collectExtensionsConfig } from './extensions.js';

describe('collectExtensionsConfig', () => {
	test('returns all defaults when nothing is configured', () => {
		expect(collectExtensionsConfig({})).toEqual({
			must_load: false,
			auto_reload: false,
			cache_ttl: false,
			limit: false,
			rolldown: false,
		});
	});

	test('returns configured boolean values', () => {
		const result = collectExtensionsConfig({
			EXTENSIONS_MUST_LOAD: true,
			EXTENSIONS_AUTO_RELOAD: true,
			EXTENSIONS_ROLLDOWN: true,
		});

		expect(result.must_load).toBe(true);
		expect(result.auto_reload).toBe(true);
		expect(result.rolldown).toBe(true);
	});

	test('returns cache_ttl as string when set', () => {
		const result = collectExtensionsConfig({ EXTENSIONS_CACHE_TTL: '10m' });
		expect(result.cache_ttl).toBe('10m');
	});

	test('returns limit as number when set', () => {
		const result = collectExtensionsConfig({ EXTENSIONS_LIMIT: '50' });
		expect(result.limit).toBe(50);
	});
});
