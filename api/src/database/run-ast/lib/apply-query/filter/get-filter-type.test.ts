import { getFilterType } from './get-filter-type.js';
import { SchemaBuilder } from '@directus/schema-builder';
import { expect, test } from 'vitest';

test(`filter type for string field`, async () => {
	const schema = new SchemaBuilder()
		.collection('articles', (c) => {
			c.field('id').id();
			c.field('title').string();
		})
		.build();

	const { type, special } = getFilterType(schema.collections['articles']!.fields, 'title', 'articles');

	expect(type).toEqual('string');
	expect(special).toEqual([]);
});

test(`filter type for integer field`, async () => {
	const schema = new SchemaBuilder()
		.collection('articles', (c) => {
			c.field('id').id();
			c.field('likes').integer();
		})
		.build();

	const { type, special } = getFilterType(schema.collections['articles']!.fields, 'likes', 'articles');

	expect(type).toEqual('integer');
	expect(special).toEqual([]);
});

test(`filter type for year(created) field`, async () => {
	const schema = new SchemaBuilder()
		.collection('articles', (c) => {
			c.field('id').id();
			c.field('created').dateTime();
		})
		.build();

	const { type, special } = getFilterType(schema.collections['articles']!.fields, 'year(created)', 'articles');

	expect(type).toEqual('integer');
	expect(special).toEqual(undefined);
});

test(`filter type unapplicable function count(created)`, async () => {
	const schema = new SchemaBuilder()
		.collection('articles', (c) => {
			c.field('id').id();
			c.field('created').dateTime();
		})
		.build();

	expect(() => {
		getFilterType(schema.collections['articles']!.fields, 'count(created)', 'articles');
	}).toThrowError('Invalid query. Invalid filter key "count(created)" on "articles".');
});
