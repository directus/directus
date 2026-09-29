import type { PrimaryKey } from '@directus/types';
import { describe, expect, test } from 'vitest';
import type { FkFieldInfo } from '../../utils/build-import-plan.js';
import { remapForeignKeys, remapValue, resolveTarget } from './remap-foreign-keys.js';

const fkField = (overrides: Partial<FkFieldInfo> & { field: string }): FkFieldInfo => ({
	target: null,
	collectionField: null,
	allowedCollections: null,
	nullable: true,
	...overrides,
});

const idMaps = (entries: Record<string, Record<string, PrimaryKey>>): Map<string, Map<string, PrimaryKey>> =>
	new Map(Object.entries(entries).map(([collection, map]) => [collection, new Map(Object.entries(map))]));

describe('resolveTarget', () => {
	test('returns the static target for an m2o field', () => {
		expect(resolveTarget(fkField({ field: 'author', target: 'authors' }), { author: 1 })).toBe('authors');
	});

	test('reads the a2o target from the sibling collection field', () => {
		const info = fkField({ field: 'item', collectionField: 'collection' });

		expect(resolveTarget(info, { collection: 'articles', item: 1 })).toBe('articles');
	});

	test('returns null when the a2o collection field is missing or non-string', () => {
		const info = fkField({ field: 'item', collectionField: 'collection' });

		expect(resolveTarget(info, { item: 1 })).toBeNull();
		expect(resolveTarget(info, { collection: 123, item: 1 })).toBeNull();
	});

	test('returns null when there is no target and no collection field', () => {
		expect(resolveTarget(fkField({ field: 'item' }), { item: 1 })).toBeNull();
	});
});

describe('remapValue', () => {
	const maps = idMaps({ authors: { '1': 100, '2': 200 } });

	test('remaps a scalar value through the target id map', () => {
		expect(remapValue(1, 'authors', maps)).toBe(100);
	});

	test('returns the original value when unmapped', () => {
		expect(remapValue(9, 'authors', maps)).toBe(9);
	});

	test('returns the value unchanged when target is null', () => {
		expect(remapValue(1, null, maps)).toBe(1);
	});

	test('passes null and undefined through untouched', () => {
		expect(remapValue(null, 'authors', maps)).toBeNull();
		expect(remapValue(undefined, 'authors', maps)).toBeUndefined();
	});

	test('remaps each entry of an array', () => {
		expect(remapValue([1, 2, 9], 'authors', maps)).toEqual([100, 200, 9]);
	});

	test('looks up keys by their string form', () => {
		const uuidMaps = idMaps({ people: { 'e59-abc': 'new-pk' } });

		expect(remapValue('e59-abc', 'people', uuidMaps)).toBe('new-pk');
	});
});

describe('remapForeignKeys', () => {
	test('clones the item without mutating the original', () => {
		const item = { id: 1, author: 2 };
		const maps = idMaps({ authors: { '2': 200 } });

		const payload = remapForeignKeys(item, [fkField({ field: 'author', target: 'authors' })], maps, new Set());

		expect(payload).toEqual({ id: 1, author: 200 });
	});

	test('drops second-pass fields from the payload', () => {
		const payload = remapForeignKeys({ id: 1, name: 'a', articles: [1, 2] }, [], idMaps({}), new Set(['articles']));

		expect(payload).toEqual({ id: 1, name: 'a' });
	});

	test('leaves null and undefined foreign keys untouched', () => {
		const info = fkField({ field: 'author', target: 'authors' });

		const payload = remapForeignKeys({ id: 1, author: null }, [info], idMaps({ authors: { '2': 200 } }), new Set());

		expect(payload).toEqual({ id: 1, author: null });
	});

	test('skips nested object foreign key values', () => {
		const info = fkField({ field: 'author', target: 'authors' });
		const nested = { id: 2 };

		const payload = remapForeignKeys({ id: 1, author: nested }, [info], idMaps({ authors: { '2': 200 } }), new Set());

		expect(payload).toEqual({ id: 1, author: nested });
	});

	test('resolves the target per-item for a2o fields', () => {
		const info = fkField({ field: 'item', collectionField: 'collection' });
		const maps = idMaps({ articles: { '5': 500 }, authors: { '5': 999 } });

		const payload = remapForeignKeys({ id: 1, collection: 'articles', item: 5 }, [info], maps, new Set());

		expect(payload).toEqual({ id: 1, collection: 'articles', item: 500 });
	});
});
