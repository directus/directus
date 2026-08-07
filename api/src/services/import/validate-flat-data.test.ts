import { ErrorCode, isDirectusError } from '@directus/errors';
import type { ImportCollectionData } from '@directus/types';
import { describe, expect, test } from 'vitest';
import type { AliasFieldInfo, FkFieldInfo } from '../../utils/build-import-plan.js';
import { validateFlatData } from './validate-flat-data.js';

const fkFields = (entries: Record<string, string[]> = {}): Map<string, FkFieldInfo[]> =>
	new Map(
		Object.entries(entries).map(([collection, names]) => [
			collection,
			names.map((field) => ({ field, target: null, collectionField: null, allowedCollections: null, nullable: true })),
		]),
	);

const aliasFields = (entries: Record<string, string[]> = {}): Map<string, AliasFieldInfo[]> =>
	new Map(
		Object.entries(entries).map(([collection, names]) => [collection, names.map((field) => ({ field, target: null }))]),
	);

const dataByCollection = (entries: Record<string, Record<string, unknown>[]>): Map<string, ImportCollectionData> =>
	new Map(Object.entries(entries).map(([collection, items]) => [collection, { collection, items }]));

describe('validateFlatData', () => {
	test('accepts scalar foreign key values', () => {
		expect(() =>
			validateFlatData(
				fkFields({ articles: ['author'] }),
				aliasFields(),
				dataByCollection({ articles: [{ id: 1, author: 2 }] }),
			),
		).not.toThrow();
	});

	test('ignores null and undefined relational values', () => {
		expect(() =>
			validateFlatData(
				fkFields({ articles: ['author'] }),
				aliasFields(),
				dataByCollection({ articles: [{ id: 1, author: null }, { id: 2 }] }),
			),
		).not.toThrow();
	});

	test('rejects a nested object (m2o) value', () => {
		try {
			validateFlatData(
				fkFields({ articles: ['author'] }),
				aliasFields(),
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
				fkFields(),
				aliasFields({ authors: ['articles'] }),
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
				fkFields(),
				aliasFields({ authors: ['articles'] }),
				dataByCollection({ authors: [{ id: 1, articles: [2, 3] }] }),
			),
		).not.toThrow();
	});

	test('ignores fields with no relational metadata', () => {
		expect(() =>
			validateFlatData(
				fkFields({ articles: [] }),
				aliasFields(),
				dataByCollection({ articles: [{ id: 1, meta: { a: 1 } }] }),
			),
		).not.toThrow();
	});
});
