import { describe, expect, test } from 'vitest';
import type { Collection } from '../../types/index.js';
import { resolveScopedCollections } from './resolve-scoped-collections.js';

const table = (name: string) => ({ collection: name, schema: { name }, meta: { group: null } }) as Collection;
const folder = (name: string) => ({ collection: name, schema: null, meta: { group: null } }) as Collection;

const collections = [
	table('articles'),
	table('authors'),
	table('tags'),
	table('articles_tags'),
	table('categories'),
	table('directus_users'),
	folder('content'),
];

const asSet = (collections: string[] | null) => new Set(collections);

describe('resolveScopedCollections', () => {
	test('returns null when no scope is given', () => {
		const result = resolveScopedCollections(collections, {});

		expect(result).toBeNull();
	});

	test('returns exactly the included collections', () => {
		const result = resolveScopedCollections(collections, { includeCollections: ['articles', 'authors'] });

		expect(asSet(result)).toEqual(new Set(['articles', 'authors']));
	});

	test('returns every collection except the excluded ones', () => {
		const result = resolveScopedCollections(collections, { excludeCollections: ['articles'] });

		expect(asSet(result)).toEqual(
			new Set(['articles_tags', 'authors', 'categories', 'content', 'directus_users', 'tags']),
		);
	});

	test('keeps a folder that is explicitly included', () => {
		const result = resolveScopedCollections(collections, { includeCollections: ['content', 'articles'] });

		expect(asSet(result)).toEqual(new Set(['articles', 'content']));
	});

	test('keeps folders when excluding by name', () => {
		const result = resolveScopedCollections(collections, { excludeCollections: ['content'] });

		expect(asSet(result)).toEqual(
			new Set(['articles', 'articles_tags', 'authors', 'categories', 'directus_users', 'tags']),
		);
	});

	test('ignores included names that do not exist', () => {
		const result = resolveScopedCollections(collections, { includeCollections: ['nope', 'articles'] });

		expect(asSet(result)).toEqual(new Set(['articles']));
	});

	test('returns an empty list when none of the included names exist', () => {
		const result = resolveScopedCollections(collections, { includeCollections: ['nope'] });

		expect(result).toEqual([]);
	});

	test('ignores excluded names that do not exist', () => {
		const result = resolveScopedCollections(collections, { excludeCollections: ['nope'] });

		expect(asSet(result)).toEqual(
			new Set(['articles', 'articles_tags', 'authors', 'categories', 'content', 'directus_users', 'tags']),
		);
	});

	test('keeps a system collection that is explicitly included', () => {
		const result = resolveScopedCollections(collections, { includeCollections: ['directus_users', 'articles'] });

		expect(asSet(result)).toEqual(new Set(['articles', 'directus_users']));
	});

	test('throws when both includeCollections and excludeCollections are given', () => {
		expect(() =>
			resolveScopedCollections(collections, { includeCollections: ['articles'], excludeCollections: ['authors'] }),
		).toThrow('"includeCollections" and "excludeCollections" parameters cannot be used together');
	});
});
