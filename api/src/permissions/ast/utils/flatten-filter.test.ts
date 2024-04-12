import type { Query } from '@directus/types';
import { expect, test } from 'vitest';
import type { FieldKey } from '../types.js';
import { flattenFilter } from './flatten-filter.js';

test('Returns early when no filter is passed', () => {
	const paths: Set<FieldKey[]> = new Set();

	flattenFilter(paths, undefined);

	expect(paths).toBe(paths);
});

test('Flattens single level', () => {
	const paths: Set<FieldKey[]> = new Set();

	const filter: Query['filter'] = {
		author: {
			_eq: 1,
		},
	};

	flattenFilter(paths, filter);

	expect(paths).toEqual(new Set([['author']]));
});

test('Flattens nested fields', () => {
	const paths: Set<FieldKey[]> = new Set();

	const filter: Query['filter'] = {
		author: {
			name: {
				_eq: 'Rijk',
			},
		},
	};

	flattenFilter(paths, filter);

	expect(paths).toEqual(new Set([['author', 'name']]));
});

test('Flattens logical groups', () => {
	const paths: Set<FieldKey[]> = new Set();

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

	expect(paths).toEqual(
		new Set([
			['author', 'name'],
			['author', 'age'],
		]),
	);
});

test('Flattens nested logical groups', () => {
	const paths: Set<FieldKey[]> = new Set();

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

	expect(paths).toEqual(new Set([['author', 'name'], ['timestamp'], ['author', 'age']]));
});

test('Leaves function usage', () => {
	const paths: Set<FieldKey[]> = new Set();

	const filter: Query['filter'] = {
		'year(timestamp)': {
			_eq: 2024,
		},
	};

	flattenFilter(paths, filter);

	expect(paths).toEqual(new Set([['year(timestamp)']]));
});
