import type { Relation } from '@directus/types';
import { expect, test } from 'vitest';
import { getRelationType } from './get-relation-type.js';

test('Returns null if no relation object is included', () => {
	const result = getRelationType({ relation: null, collection: null, field: 'test' });
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

	const result = getRelationType({
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

	const result = getRelationType({
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

	const result = getRelationType({
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

	const result = getRelationType({
		relation,
		collection: 'unrelated',
		field: 'wrong',
	});

	expect(result).toBe(null);
});
