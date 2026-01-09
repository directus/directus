import { describe, expect, it, test } from 'vitest';
import type { Relation } from '@directus/types';
import { getRelationType, getRelationTypeServer } from './get-relation-type.js';

describe('getRelationType', () => {
	it('returns m2o when relation is the same as collection and field', () => {
		const mockRelation = { collection: 'test', related_collection: 'test2', field: 'testField' } as Relation;
		expect(getRelationType({ relation: mockRelation, collection: 'test', field: 'testField' })).toBe('m2o');
	});

	it('returns m2a when one_allowed_collections and one_collection_field are defined', () => {
		const mockRelation = {
			collection: 'test',
			related_collection: 'test2',
			field: 'testField',
			meta: {
				one_allowed_collections: ['test', 'test2'],
				one_collection_field: 'testField',
			},
		} as Relation;

		expect(getRelationType({ relation: mockRelation, collection: 'test', field: 'testField' })).toBe('m2a');
	});

	it('returns o2m when related_collection is the same as collection and field', () => {
		const mockRelation = {
			collection: 'test',
			related_collection: 'test2',
			field: 'testField',
			meta: { one_field: 'testField' },
		} as Relation;

		expect(getRelationType({ relation: mockRelation, collection: 'test2', field: 'testField' })).toBe('o2m');
	});
});

describe('getRelationTypeServer', () => {
	test('Returns null if no relation object is included', () => {
		const result = getRelationTypeServer({ relation: null, collection: null, field: 'test' });
		expect(result).toBe(null);
	});

	test('Returns a2o if relation matches and includes one_collection_field and one_allowed_collection', () => {
		const relation = {
			collection: 'pages',
			field: 'item',
			related_collection: null,
			meta: {
				one_collection_field: 'collection',
				one_allowed_collections: ['paragraphs', 'headings', 'images'],
			},
		} as Relation;

		const result = getRelationTypeServer({
			relation,
			collection: 'pages',
			field: 'item',
		});

		expect(result).toBe('a2o');
	});

	test('Returns m2o', () => {
		const relation = {
			collection: 'articles',
			field: 'author',
			related_collection: 'authors',
		} as Relation;

		const result = getRelationTypeServer({
			relation,
			collection: 'articles',
			field: 'author',
		});

		expect(result).toBe('m2o');
	});

	test('Returns o2m', () => {
		const relation = {
			collection: 'articles',
			field: 'author',
			related_collection: 'authors',
			meta: {
				one_field: 'articles',
			},
		} as Relation;

		const result = getRelationTypeServer({
			relation,
			collection: 'authors',
			field: 'articles',
		});

		expect(result).toBe('o2m');
	});

	test('Returns null when field/collection does not match the relationship', () => {
		const relation = {
			collection: 'articles',
			field: 'author',
			related_collection: 'authors',
			meta: {
				one_field: 'articles',
			},
		} as Relation;

		const result = getRelationTypeServer({
			relation,
			collection: 'unrelated',
			field: 'wrong',
		});

		expect(result).toBe(null);
	});
});
