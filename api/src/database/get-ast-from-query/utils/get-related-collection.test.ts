import { SchemaBuilder } from '@directus/schema-builder';
import { getRelation } from '@directus/utils';
import { expect, test } from 'vitest';
import { getRelatedCollection, getRelatedCollectionFromRelation } from './get-related-collection.js';

test('relation on a primitive field', () => {
	const schema = new SchemaBuilder()
		.collection('article', (c) => {
			c.field('id').id();
			c.field('title').string();
		})
		.build();

	const result = getRelatedCollection(schema, 'article', 'title');

	expect(result).toBeNull();
});

test('relation on wrong collection', () => {
	const schema = new SchemaBuilder()
		.collection('article', (c) => {
			c.field('id').id();
			c.field('title').string();
		})
		.build();

	const result = getRelatedCollection(schema, 'wrong', 'title');

	expect(result).toBeNull();
});

test('relation on wrong field', () => {
	const schema = new SchemaBuilder()
		.collection('article', (c) => {
			c.field('id').id();
			c.field('title').string();
		})
		.build();

	const result = getRelatedCollection(schema, 'article', 'wrong');

	expect(result).toBeNull();
});

test('relation on o2m field', () => {
	const schema = new SchemaBuilder()
		.collection('article', (c) => {
			c.field('id').id();
			c.field('links').o2m('link_list', 'article_id');
		})
		.build();

	const result = getRelatedCollection(schema, 'article', 'links');

	expect(result).toEqual('link_list');
});

test('relation on m2o field', () => {
	const schema = new SchemaBuilder()
		.collection('article', (c) => {
			c.field('id').id();
			c.field('author').m2o('users');
		})
		.build();

	const result = getRelatedCollection(schema, 'article', 'author');

	expect(result).toEqual('users');
});

test('resolving from a known relation matches resolving from the schema', () => {
	const schema = new SchemaBuilder()
		.collection('article', (c) => {
			c.field('id').id();
			c.field('author').m2o('users');
			c.field('links').o2m('link_list', 'article_id');
		})
		.build();

	for (const [collection, field] of [
		['article', 'author'],
		['article', 'links'],
		['users', 'author'],
		['article', 'id'],
	] as const) {
		const relation = getRelation(schema.relations, collection, field);

		expect(relation ? getRelatedCollectionFromRelation(relation, collection, field) : null).toEqual(
			getRelatedCollection(schema, collection, field),
		);
	}
});
