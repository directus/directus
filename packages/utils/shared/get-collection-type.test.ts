import type { Collection } from '@directus/types';
import { describe, expect, it } from 'vitest';
import { getCollectionType } from './get-collection-type.js';

describe('getCollectionType', () => {
	it('returns "table" when collection has schema', () => {
		const collection = {
			schema: { name: 'test_table' },
		} as Collection;

		expect(getCollectionType(collection)).toBe('table');
	});

	it('returns "alias" when collection has meta but no schema', () => {
		const collection = {
			meta: { collection: 'test_alias' },
		} as Collection;

		expect(getCollectionType(collection)).toBe('alias');
	});

	it('returns "unknown" when collection has neither schema nor meta', () => {
		const collection = {} as Collection;

		expect(getCollectionType(collection)).toBe('unknown');
	});

	it('returns "table" when collection has both schema and meta', () => {
		const collection = {
			schema: { name: 'test_table' },
			meta: { collection: 'test_table' },
		} as Collection;

		expect(getCollectionType(collection)).toBe('table');
	});

	it('returns "alias" when schema is null and meta exists', () => {
		const collection = {
			schema: null,
			meta: { collection: 'test_alias' },
		} as Collection;

		expect(getCollectionType(collection)).toBe('alias');
	});

	it('returns "unknown" when both schema and meta are null', () => {
		const collection = {
			schema: null,
			meta: null,
		} as Collection;

		expect(getCollectionType(collection)).toBe('unknown');
	});
});
