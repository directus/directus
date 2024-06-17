import type { Query } from '@directus/types';
import { expect, test } from 'vitest';
import { extractPathsFromQuery } from './extract-paths-from-query.js';

test('Returns empty set when query does not contain filter sort or aggregate', () => {
	expect(extractPathsFromQuery({})).toEqual([]);
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

	expect(extractPathsFromQuery(query)).toEqual([['author', 'name']]);
});

test('Returns sort values split on `.`', () => {
	const query: Query = {
		sort: ['title', 'author.age'],
	};

	expect(extractPathsFromQuery(query)).toEqual([['title'], ['author', 'age']]);
});

test('Drops - from sort values', () => {
	const query: Query = {
		sort: ['-title'],
	};

	expect(extractPathsFromQuery(query)).toEqual([['title']]);
});

test('Returns fields used in aggregation', () => {
	const query: Query = {
		aggregate: {
			avg: ['price'],
			countDistinct: ['id', 'author.age'],
		},
	};

	expect(extractPathsFromQuery(query)).toEqual([['price'], ['id'], ['author', 'age']]);
});

test('Returns fields used in grouping', () => {
	const query: Query = {
		group: ['category', 'author.email'],
	};

	expect(extractPathsFromQuery(query)).toEqual([['category'], ['author', 'email']]);
});

test('Returns only unique field paths', () => {
	const query: Query = {
		aggregate: {
			countDistinct: ['category', 'author.email'],
		},
		group: ['category', 'author.email'],
	};

	expect(extractPathsFromQuery(query)).toEqual([['category'], ['author', 'email']]);
});
