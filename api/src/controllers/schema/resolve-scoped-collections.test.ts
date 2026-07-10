import { SchemaBuilder } from '@directus/schema-builder';
import { describe, expect, test } from 'vitest';
import { resolveScopedCollections } from './resolve-scoped-collections.js';

const schema = new SchemaBuilder()
	.collection('articles', (c) => c.field('id').id())
	.collection('authors', (c) => c.field('id').id())
	.collection('tags', (c) => c.field('id').id())
	.collection('articles_tags', (c) => c.field('id').id())
	.collection('categories', (c) => c.field('id').id())
	.collection('directus_users', (c) => c.field('id').id())
	.build();

const asSet = (collections: string[] | null) => new Set(collections);

describe('resolveScopedCollections', () => {
	test('returns null when no scope is given', () => {
		const result = resolveScopedCollections(schema, {});

		expect(result).toBeNull();
	});

	test('returns exactly the included collections', () => {
		const result = resolveScopedCollections(schema, { includeCollections: ['articles', 'authors'] });

		expect(asSet(result)).toEqual(new Set(['articles', 'authors']));
	});

	test('returns every collection except the excluded ones', () => {
		const result = resolveScopedCollections(schema, { excludeCollections: ['articles'] });

		expect(asSet(result)).toEqual(new Set(['articles_tags', 'authors', 'categories', 'directus_users', 'tags']));
	});

	test('ignores included names that do not exist in the schema', () => {
		const result = resolveScopedCollections(schema, { includeCollections: ['nope', 'articles'] });

		expect(asSet(result)).toEqual(new Set(['articles']));
	});

	test('returns an empty list when none of the included names exist', () => {
		const result = resolveScopedCollections(schema, { includeCollections: ['nope'] });

		expect(result).toEqual([]);
	});

	test('ignores excluded names that do not exist in the schema', () => {
		const result = resolveScopedCollections(schema, { excludeCollections: ['nope'] });

		expect(asSet(result)).toEqual(
			new Set(['articles', 'articles_tags', 'authors', 'categories', 'directus_users', 'tags']),
		);
	});

	test('keeps a system collection that is explicitly included', () => {
		const result = resolveScopedCollections(schema, { includeCollections: ['directus_users', 'articles'] });

		expect(asSet(result)).toEqual(new Set(['articles', 'directus_users']));
	});

	test('throws when both includeCollections and excludeCollections are given', () => {
		expect(() =>
			resolveScopedCollections(schema, { includeCollections: ['articles'], excludeCollections: ['authors'] }),
		).toThrow('"includeCollections" and "excludeCollections" parameters cannot be used together');
	});
});
