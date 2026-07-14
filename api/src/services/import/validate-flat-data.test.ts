import { ErrorCode, isDirectusError } from '@directus/errors';
import type { ImportCollectionData } from '@directus/types';
import { describe, expect, test } from 'vitest';
import { validateFlatData } from './validate-flat-data.js';

const relationalFields = (entries: Record<string, string[]>): Map<string, Set<string>> =>
	new Map(Object.entries(entries).map(([collection, fields]) => [collection, new Set(fields)]));

const dataByCollection = (entries: Record<string, Record<string, unknown>[]>): Map<string, ImportCollectionData> =>
	new Map(Object.entries(entries).map(([collection, items]) => [collection, { collection, items }]));

describe('validateFlatData', () => {
	test('accepts scalar foreign key values', () => {
		expect(() =>
			validateFlatData(
				relationalFields({ articles: ['author'] }),
				dataByCollection({ articles: [{ id: 1, author: 2 }] }),
			),
		).not.toThrow();
	});

	test('ignores null and undefined relational values', () => {
		expect(() =>
			validateFlatData(
				relationalFields({ articles: ['author'] }),
				dataByCollection({ articles: [{ id: 1, author: null }, { id: 2 }] }),
			),
		).not.toThrow();
	});

	test('rejects a nested object (m2o) value', () => {
		try {
			validateFlatData(
				relationalFields({ articles: ['author'] }),
				dataByCollection({ articles: [{ id: 1, author: { id: 2 } }] }),
			);

			expect.fail('should have thrown');
		} catch (error) {
			expect(isDirectusError(error, ErrorCode.InvalidPayload)).toBe(true);
		}
	});

	test('rejects an array containing an object (o2m) value', () => {
		try {
			validateFlatData(
				relationalFields({ authors: ['articles'] }),
				dataByCollection({ authors: [{ id: 1, articles: [{ id: 2 }] }] }),
			);

			expect.fail('should have thrown');
		} catch (error) {
			expect(isDirectusError(error, ErrorCode.InvalidPayload)).toBe(true);
		}
	});

	test('accepts an array of scalar foreign keys', () => {
		expect(() =>
			validateFlatData(
				relationalFields({ authors: ['articles'] }),
				dataByCollection({ authors: [{ id: 1, articles: [2, 3] }] }),
			),
		).not.toThrow();
	});

	test('ignores fields with no relational metadata', () => {
		expect(() =>
			validateFlatData(relationalFields({ articles: [] }), dataByCollection({ articles: [{ id: 1, meta: { a: 1 } }] })),
		).not.toThrow();
	});
});
