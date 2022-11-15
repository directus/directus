import { calculateFieldDepth } from '../../src/utils/calculate-field-depth';
import { test, expect } from 'vitest';

test('Calculates basic depth', () => {
	const filter = {
		name: {
			_eq: 'test',
		},
	};

	const result = calculateFieldDepth(filter);

	expect(result).toBe(1);
});

test('Calculates relational depth', () => {
	const filter = {
		author: {
			name: {
				_eq: 'test',
			},
		},
	};

	const result = calculateFieldDepth(filter);

	expect(result).toBe(2);
});

test('Ignores _and/_or', () => {
	const filter = {
		_and: [
			{
				_or: [
					{
						author: {
							name: {
								_eq: 'Directus',
							},
						},
					},
					{
						status: {
							_eq: 'published',
						},
					},
				],
			},
			{
				category: {
					_eq: 'recipes',
				},
			},
		],
	};

	const result = calculateFieldDepth(filter);

	expect(result).toBe(2);
});

test('Skips underscore prefix in tree', () => {
	const deep = {
		translations: {
			_filter: {
				language_id: {
					code: {
						_eq: 'nl-NL',
					},
				},
			},
		},
	};

	const result = calculateFieldDepth(deep);

	expect(result).toBe(3);
});

test('Calculates _sort in deep correctly', () => {
	const deep = {
		articles: {
			_sort: ['sort', 'category.type.sort'],
		},
	};

	const result = calculateFieldDepth(deep, ['_sort']);

	expect(result).toBe(4);
});
