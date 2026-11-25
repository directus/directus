import { SchemaBuilder } from '@directus/schema-builder';
import { describe, expect, test } from 'vitest';
import { isRelationalFilter } from './is-relational-filter.js';

const schema = new SchemaBuilder()
	.collection('articles', (c) => {
		c.field('id').id();
		c.field('title').string();
		c.field('author').m2o('users');
		c.field('links').o2m('links', 'article_id');
	})
	.build();

describe('isRelationalFilter', () => {
	test.each([
		{ description: 'a regular field', collection: 'articles', path: ['title'], expected: false },
		{ description: 'a function on a regular field', collection: 'articles', path: ['year(title)'], expected: false },
		{ description: 'an m2o field without a nested path', collection: 'articles', path: ['author'], expected: false },
		{ description: 'an unknown collection', collection: 'unknown', path: ['title'], expected: false },
		{ description: 'a path into another collection', collection: 'articles', path: ['author', 'name'], expected: true },
		{ description: 'an alias field', collection: 'articles', path: ['links'], expected: true },
	])('should return "$expected" for $description', ({ collection, path, expected }) => {
		expect(isRelationalFilter(schema, collection, path)).toBe(expected);
	});
});
