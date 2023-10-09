import type { DeepPartial, Relation } from '@directus/types';
import { describe, expect, it } from 'vitest';
import { getRelationInfo } from './get-relation-info.js';

describe('getRelationInfo', () => {
	it('Errors on suspiciously long implicit $FOLLOW', () => {
		expect(() =>
			getRelationInfo(
				[],
				'related_test_collection',
				'$FOLLOW(test_collection, test_field, aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa)'
			)
		).toThrowError(Error);
	});

	it('Generates a new relation object for an implicit o2m relation', () => {
		const result = getRelationInfo([], 'related_test_collection', '$FOLLOW(test_collection, test_field)');

		expect(result).toEqual({
			relation: {
				collection: 'test_collection',
				field: 'test_field',
				related_collection: 'related_test_collection',
				schema: null,
				meta: null,
			},
			relationType: 'o2m',
		});
	});

	it('Generates a new relation object for an implicit o2a relation', () => {
		const result = getRelationInfo(
			[],
			'related_test_collection',
			'$FOLLOW(test_collection, test_field, test_collection_field)'
		);

		expect(result).toEqual({
			relation: {
				collection: 'test_collection',
				field: 'test_field',
				related_collection: 'related_test_collection',
				schema: null,
				meta: {
					one_collection_field: 'test_collection_field',
				},
			},
			relationType: 'o2a',
		});
	});

	it('Returns the correct existing relation for the given collection/field', () => {
		const testRelations: DeepPartial<Relation>[] = [
			// o2m
			{
				collection: 'articles',
				field: 'author_id',
				related_collection: 'authors',
				meta: {
					one_field: 'articles',
				},
				schema: null,
			},

			// m2o
			{
				collection: 'articles',
				field: 'category_id',
				related_collection: 'categories',
				meta: null,
				schema: null,
			},

			// a2o
			{
				collection: 'pages',
				field: 'item',
				related_collection: null,
				meta: {
					one_collection_field: 'collection',
					one_allowed_collections: ['headings', 'paragraphs', 'images'],
				},
			},
		];

		const o2mResult = getRelationInfo(testRelations as Relation[], 'authors', 'articles');

		expect(o2mResult).toEqual({
			relationType: 'o2m',
			relation: testRelations[0],
		});

		const m2oResult = getRelationInfo(testRelations as Relation[], 'articles', 'category_id');

		expect(m2oResult).toEqual({
			relationType: 'm2o',
			relation: testRelations[1],
		});

		const a2oResult = getRelationInfo(testRelations as Relation[], 'pages', 'item');

		expect(a2oResult).toEqual({
			relationType: 'a2o',
			relation: testRelations[2],
		});

		const noResult = getRelationInfo(testRelations as Relation[], 'does not exist', 'wrong field');

		expect(noResult).toEqual({
			relation: null,
			relationType: null,
		});
	});
});
