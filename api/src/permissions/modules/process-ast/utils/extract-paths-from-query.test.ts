import type { Query } from '@directus/types';
import { expect, test, vi } from 'vitest';
import { extractPathsFromQuery } from './extract-paths-from-query.js';

vi.mock('@directus/env', () => ({
	useEnv: vi.fn().mockReturnValue({
		MAX_JSON_QUERY_DEPTH: 10,
	}),
}));

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

test('Extracts underlying field from json() sort expression', () => {
	const query: Query = {
		sort: ['json(metadata, color)'],
	};

	expect(extractPathsFromQuery(query).readOnlyPaths).toEqual([['metadata']]);
});

test('Extracts underlying field from descending json() sort expression', () => {
	const query: Query = {
		sort: ['-json(metadata, color)'],
	};

	expect(extractPathsFromQuery(query).readOnlyPaths).toEqual([['metadata']]);
});

test('Extracts underlying field from json() sort with dotted path', () => {
	const query: Query = {
		sort: ['json(metadata, dimensions.width)'],
	};

	expect(extractPathsFromQuery(query).readOnlyPaths).toEqual([['metadata']]);
});

test('Resolves alias to json() expression and extracts underlying field', () => {
	const query: Query = {
		sort: ['my_color'],
		alias: { my_color: 'json(metadata, color)' },
	};

	expect(extractPathsFromQuery(query).readOnlyPaths).toEqual([['metadata']]);
});

test('Resolves descending alias to json() expression and extracts underlying field', () => {
	const query: Query = {
		sort: ['-my_color'],
		alias: { my_color: 'json(metadata, color)' },
	};

	expect(extractPathsFromQuery(query).readOnlyPaths).toEqual([['metadata']]);
});

test('Resolves non-json alias to the target field name', () => {
	const query: Query = {
		sort: ['label'],
		alias: { label: 'name' },
	};

	expect(extractPathsFromQuery(query).readOnlyPaths).toEqual([['name']]);
});

test('Deduplicates when multiple json() sort expressions resolve to the same field', () => {
	const query: Query = {
		sort: ['json(metadata, color)', 'json(metadata, size)'],
	};

	expect(extractPathsFromQuery(query).readOnlyPaths).toEqual([['metadata']]);
});
