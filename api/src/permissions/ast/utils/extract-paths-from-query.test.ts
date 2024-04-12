import type { Query } from '@directus/types';
import { expect, test } from 'vitest';
import { extractPathsFromQuery } from './extract-paths-from-query.js';

test('Returns empty set when query does not contain filter sort or aggregate', () => {
	expect(extractPathsFromQuery({})).toEqual(new Set());
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

	expect(extractPathsFromQuery(query)).toEqual(new Set([['author', 'name']]));
});

test('Returns sort values split on `.`', () => {
	const query: Query = {
		sort: ['title', 'author.age'],
	};

	expect(extractPathsFromQuery(query)).toEqual(new Set([['title'], ['author', 'age']]));
});

test('Drops - from sort values', () => {
	const query: Query = {
		sort: ['-title'],
	};

	expect(extractPathsFromQuery(query)).toEqual(new Set([['title']]));
});

test('Returns fields used in aggregation', () => {
	const query: Query = {
		aggregate: {
			avg: ['price'],
			countDistinct: ['id', 'author.age'],
		},
	};

	expect(extractPathsFromQuery(query)).toEqual(new Set([['price'], ['id'], ['author', 'age']]));
});

test('Returns fields used in grouping', () => {
	const query: Query = {
		group: ['category', 'author.email'],
	};

	expect(extractPathsFromQuery(query)).toEqual(new Set([['category'], ['author', 'email']]));
});
