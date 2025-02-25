import { expect, test } from 'vitest';
import { buildCollectionAndFieldRelations } from './build-collection-and-field-relations.js';

test('get relations for no relations', () => {
	const relations = buildCollectionAndFieldRelations([]);

	expect(relations).toEqual({ collectionRelationTree: new Map(), fieldToCollectionList: new Map() });
});

test('get relations for no m2o relation', () => {
	const relations = buildCollectionAndFieldRelations([
		{
			collection: 'A',
			field: 'a',
			related_collection: 'B',
			meta: {} as any,
			schema: {} as any,
		},
	]);

	expect(relations).toEqual({
		collectionRelationTree: new Map([['B', new Set(['A'])]]),
		fieldToCollectionList: new Map([['A:a', 'B']]),
	});
});

test('get relations for no o2m relation', () => {
	const relations = buildCollectionAndFieldRelations([
		{
			collection: 'A',
			field: 'a',
			related_collection: 'B',
			meta: {
				one_field: 'b',
			} as any,
			schema: {} as any,
		},
	]);

	expect(relations).toEqual({
		collectionRelationTree: new Map([
			['B', new Set(['A'])],
			['A', new Set(['B'])],
		]),
		fieldToCollectionList: new Map([
			['B:b', 'A'],
			['A:a', 'B'],
		]),
	});
});

test('get relations for no m2a relation', () => {
	const relations = buildCollectionAndFieldRelations([
		{
			collection: 'A',
			field: 'a',
			related_collection: null,
			meta: {
				one_allowed_collections: ['B', 'C'],
				one_collection_field: 'b',
			} as any,
			schema: {} as any,
		},
	]);

	expect(relations).toEqual({
		collectionRelationTree: new Map([
			['B', new Set(['A'])],
			['C', new Set(['A'])],
		]),
		fieldToCollectionList: new Map([
			['A:a:B', 'B'],
			['A:a:C', 'C'],
		]),
	});
});
