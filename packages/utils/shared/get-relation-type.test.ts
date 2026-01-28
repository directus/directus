import type { Relation } from '@directus/types';
import { describe, expect, it } from 'vitest';
import { getRelationType } from './get-relation-type.js';

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

	it('returns null if no relation object is included', () => {
		const result = getRelationType({ relation: null as any, collection: null, field: 'test' });
		expect(result).toBe(null);
	});

	it('returns null when field/collection does not match the relationship', () => {
		const relation = {
			collection: 'articles',
			field: 'author',
			related_collection: 'authors',
			meta: { one_field: 'articles' },
		} as Relation;

		const result = getRelationType({ relation, collection: 'unrelated', field: 'wrong' });
		expect(result).toBe(null);
	});

	it('returns a2o instead of m2a when useA2O is true', () => {
		const mockRelation = {
			collection: 'test',
			related_collection: 'test2',
			field: 'testField',
			meta: {
				one_allowed_collections: ['test', 'test2'],
				one_collection_field: 'testField',
			},
		} as Relation;

		expect(getRelationType({ relation: mockRelation, collection: 'test', field: 'testField', useA2O: true })).toBe(
			'a2o',
		);
	});
});
