import { describe, expect, it } from 'vitest';
import { readRegistryExtensions } from './extensions.js';

describe('readRegistryExtensions', () => {
	it('builds the correct GET request with no query', () => {
		const result = readRegistryExtensions()();

		expect(result).toStrictEqual({
			path: '/extensions/registry',
			params: {},
			method: 'GET',
		});
	});

	it('passes query params through', () => {
		const query = { search: 'charts', limit: 10, offset: 20, sort: 'popular' as const };

		const result = readRegistryExtensions(query)();

		expect(result).toStrictEqual({
			path: '/extensions/registry',
			params: query,
			method: 'GET',
		});
	});

	it('passes filter params through', () => {
		const query = { filter: { type: { _eq: 'panel' as const } } };

		const result = readRegistryExtensions(query)();

		expect(result).toStrictEqual({
			path: '/extensions/registry',
			params: query,
			method: 'GET',
		});
	});
});
