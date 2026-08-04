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

const allNames = collections.map(({ collection }) => collection);

describe('resolveScopedCollections', () => {
	test('returns null when no scope is given', () => {
		expect(resolveScopedCollections(collections, {})).toBeNull();
		expect(resolveScopedCollections(collections, undefined)).toBeNull();
	});

	test('returns exactly the included collections', () => {
		const result = resolveScopedCollections(collections, { includeCollections: ['articles', 'authors'] });

		expect(result).toEqual(new Set(['articles', 'authors']));
	});

	test('returns every collection except the excluded ones', () => {
		const result = resolveScopedCollections(collections, { excludeCollections: ['articles'] });

		expect(result).toEqual(new Set(['articles_tags', 'authors', 'categories', 'content', 'directus_users', 'tags']));
	});

	test('keeps a folder that is explicitly included', () => {
		const result = resolveScopedCollections(collections, { includeCollections: ['content', 'articles'] });

		expect(result).toEqual(new Set(['articles', 'content']));
	});

	test('excludes a folder by name', () => {
		const result = resolveScopedCollections(collections, { excludeCollections: ['content'] });

		expect(result).toEqual(new Set(['articles', 'articles_tags', 'authors', 'categories', 'directus_users', 'tags']));
	});

	test('ignores included names that do not exist', () => {
		const result = resolveScopedCollections(collections, { includeCollections: ['nope', 'articles'] });

		expect(result).toEqual(new Set(['articles']));
	});

	test('keeps every collection when nothing is effectively excluded', () => {
		expect(resolveScopedCollections(collections, { excludeCollections: ['nope'] })).toEqual(new Set(allNames));
		expect(resolveScopedCollections(collections, { excludeCollections: [] })).toEqual(new Set(allNames));
	});

	test('treats an empty includeCollections list as an empty scope, not a full snapshot', () => {
		const result = resolveScopedCollections(collections, { includeCollections: [] });

		expect(result).toEqual(new Set());
	});

	test('returns an empty set when every collection is excluded', () => {
		const result = resolveScopedCollections(collections, { excludeCollections: allNames });

		expect(result).toEqual(new Set());
	});

	test('deduplicates repeated names', () => {
		const result = resolveScopedCollections(collections, { includeCollections: ['articles', 'articles', 'authors'] });

		expect(result).toEqual(new Set(['articles', 'authors']));
	});

	test('keeps a system collection that is explicitly included', () => {
		const result = resolveScopedCollections(collections, { includeCollections: ['directus_users', 'articles'] });

		expect(result).toEqual(new Set(['articles', 'directus_users']));
	});

	test('throws when both includeCollections and excludeCollections are given', () => {
		expect(() =>
			resolveScopedCollections(collections, { includeCollections: ['articles'], excludeCollections: ['authors'] }),
		).toThrow('"includeCollections" and "excludeCollections" parameters cannot be used together');
	});
});
