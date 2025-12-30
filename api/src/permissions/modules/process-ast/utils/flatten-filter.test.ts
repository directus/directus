import type { FieldKey } from '../types.js';
import { flattenFilter } from './flatten-filter.js';
import type { Filter, Query } from '@directus/types';
import { expect, test } from 'vitest';

test('Returns early when no filter is passed', () => {
	const paths: FieldKey[][] = [];

	flattenFilter(paths, undefined);

	expect(paths).toEqual([]);
});

test('Flattens single level', () => {
	const paths: FieldKey[][] = [];

	const filter: Query['filter'] = {
		author: {
			_eq: 1,
		},
	};

	flattenFilter(paths, filter);

	expect(paths).toEqual([['author']]);
});

test('Flattens _eq shortcut', () => {
	const paths: FieldKey[][] = [];

	const filter: Query['filter'] = {
		author: 'Rijk',
	} as Filter;

	flattenFilter(paths, filter);

	expect(paths).toEqual([['author']]);
});

test.todo('Flattens single level and handles underscore in field names', () => {
	const paths: FieldKey[][] = [];

	const filter: Query['filter'] = {
		_author: {
			_eq: 1,
		},
	};

	flattenFilter(paths, filter);

	expect(paths).toEqual([['_author']]);
});

test('Flattens nested fields', () => {
	const paths: FieldKey[][] = [];

	const filter: Query['filter'] = {
		author: {
			name: {
				_eq: 'Rijk',
			},
		},
	};

	flattenFilter(paths, filter);

	expect(paths).toEqual([['author', 'name']]);
});

test('Flattens logical groups', () => {
	const paths: FieldKey[][] = [];

	const filter: Query['filter'] = {
		_and: [
			{
				author: {
					name: {
						_eq: 'Rijk',
					},
				},
			},
			{
				author: {
					age: {
						_eq: 28,
					},
				},
			},
		],
	};

	flattenFilter(paths, filter);

	expect(paths).toEqual([
		['author', 'age'],
		['author', 'name'],
	]);
});

test('Flattens nested logical groups', () => {
	const paths: FieldKey[][] = [];

	const filter: Query['filter'] = {
		_and: [
			{
				_or: [
					{
						author: {
							name: {
								_eq: 'Rijk',
							},
						},
					},
					{
						_and: [
							{
								timestamp: {
									_gte: '2024-04-12',
								},
							},
							{
								author: {
									age: {
										_gt: 21,
									},
								},
							},
						],
					},
				],
			},
		],
	};

	flattenFilter(paths, filter);

	expect(paths).toEqual([['author', 'age'], ['timestamp'], ['author', 'name']]);
});

test('Leaves function usage', () => {
	const paths: FieldKey[][] = [];

	const filter: Query['filter'] = {
		'year(timestamp)': {
			_eq: 2024,
		},
	};

	flattenFilter(paths, filter);

	expect(paths).toEqual([['year(timestamp)']]);
});

test.each(['_and', '_or'])('Checks inside of logical operator (%s)', (operator) => {
	const paths: FieldKey[][] = [];

	const filter = {
		[operator]: [
			{
				author: { _eq: 'Rijk' },
				published: { year: { _eq: 2024 } },
			},
		],
	} as Query['filter'];

	flattenFilter(paths, filter);

	expect(paths).toEqual([['published', 'year'], ['author']]);
});

test.each(['_some', '_none'])('Checks inside of relational operator (%s)', (operator) => {
	const paths: FieldKey[][] = [];

	const filter = {
		[operator]: {
			author: { _eq: 'Rijk' },
			published: { year: { _eq: 2024 } },
		},
	} as Query['filter'];

	flattenFilter(paths, filter);

	expect(paths).toEqual([['published', 'year'], ['author']]);
});

test('Does not look into operators that might contain objects', () => {
	const paths: FieldKey[][] = [];

	const filter = {
		_intersects: {
			type: 'Point',
		},
	} as Query['filter'];

	flattenFilter(paths, filter);

	expect(paths).toEqual([]);
});
