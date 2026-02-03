import { SchemaBuilder } from '@directus/schema-builder';
import { expect, test } from 'vitest';
import { getRelatedCollection } from './get-related-collection.js';

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
