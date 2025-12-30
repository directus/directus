import { extractPathsFromQuery } from './extract-paths-from-query.js';
import type { Query } from '@directus/types';
import { expect, test } from 'vitest';

test('Returns empty lists when query does not contain filter sort or aggregate', () => {
	expect(extractPathsFromQuery({})).toEqual({ paths: [], readOnlyPaths: [] });
});

test('Returns flattened filter paths if filter exists', () => {
	const query: Query = {
		filter: {
			author: {
				name: {
					_eq: 'Rijk',
				},
			},
		},
	};

	expect(extractPathsFromQuery(query).readOnlyPaths).toEqual([['author', 'name']]);
});

test('Returns sort values split on `.`', () => {
	const query: Query = {
		sort: ['title', 'author.age'],
	};

	expect(extractPathsFromQuery(query).readOnlyPaths).toEqual([['title'], ['author', 'age']]);
});

test('Drops - from sort values', () => {
	const query: Query = {
		sort: ['-title'],
	};

	expect(extractPathsFromQuery(query).readOnlyPaths).toEqual([['title']]);
});

test('Returns fields used in aggregation', () => {
	const query: Query = {
		aggregate: {
			avg: ['price'],
			countDistinct: ['id', 'author.age'],
		},
	};

	expect(extractPathsFromQuery(query).paths).toEqual([['price'], ['id'], ['author', 'age']]);
});

test('Returns fields used in grouping', () => {
	const query: Query = {
		group: ['category', 'author.email'],
	};

	expect(extractPathsFromQuery(query).paths).toEqual([['category'], ['author', 'email']]);
});

test('Returns only unique field paths', () => {
	const query: Query = {
		aggregate: {
			countDistinct: ['category', 'author.email'],
		},
		group: ['category', 'author.email'],
	};

	expect(extractPathsFromQuery(query).paths).toEqual([['category'], ['author', 'email']]);
});

test('Returns only unique filter paths', () => {
	const query: Query = {
		filter: {
			_or: [
				{
					author: { _eq: 'Rijk' },
				},
				{
					author: { _eq: 'Ben' },
				},
			],
		},
	};

	expect(extractPathsFromQuery(query).readOnlyPaths).toEqual([['author']]);
});

test('Does not include wildcard field from aggregate', () => {
	const query: Query = {
		aggregate: {
			count: ['*'],
		},
	};

	expect(extractPathsFromQuery(query).paths).toEqual([]);
});
