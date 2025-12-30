import { getCollectionRelationList } from './get-collection-relation-list.js';
import { expect, test } from 'vitest';

test('get empty list for no tree', () => {
	const list = getCollectionRelationList('collection', new Map());

	expect(list).toEqual(new Set());
});

test('get empty list for tree without collection', () => {
	const list = getCollectionRelationList('collection', new Map([['A', new Set(['B'])]]));

	expect(list).toEqual(new Set());
});

test('get list for tree with collection and system collection', () => {
	const list = getCollectionRelationList('collection', new Map([['collection', new Set(['A', 'directus_fields'])]]));

	expect(list).toEqual(new Set(['A']));
});

test('get list for tree with collection and circular relation', () => {
	const list = getCollectionRelationList('collection', new Map([['collection', new Set(['A', 'collection'])]]));

	expect(list).toEqual(new Set(['A']));
});

test('get list for tree with multi linked collection', () => {
	const list = getCollectionRelationList(
		'collection',
		new Map([
			['collection', new Set(['A'])],
			['A', new Set(['B', 'C'])],
			['C', new Set(['D', 'B'])],
			['D', new Set(['F', 'G'])],
			['B', new Set(['E', 'A'])],
		]),
	);

	expect(list).toEqual(new Set(['A', 'B', 'C', 'D', 'E', 'F', 'G']));
});
