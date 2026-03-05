import { describe, expect, test } from 'vitest';
import { getFieldRelationalDepth } from './get-field-relational-depth.js';

describe('getFieldRelationalDepth', () => {
	const testCases = [
		{
			description: 'counts a simple field as depth 1',
			input: 'name',
			expected: 1,
		},
		{
			description: 'counts relational segments separated by dots',
			input: 'a.b.c',
			expected: 3,
		},
		{
			description: 'treats a bare function field as depth 1',
			input: 'json(metadata, path.to[0].value)',
			expected: 1,
		},
		{
			description: 'counts relational segments before a function, ignoring dots inside arguments',
			input: 'category_id.json(metadata, settings.color)',
			expected: 2,
		},
		{
			description: 'counts multiple relational segments before a function',
			input: 'a.b.count(field)',
			expected: 3,
		},
		{
			description: 'counts relational segments inside a single-argument function',
			input: 'year(a.field)',
			expected: 2,
		},
		{
			description: 'counts multiple relational segments inside a single-argument function',
			input: 'week(a.b.field)',
			expected: 3,
		},
		{
			description: 'counts relational segments from the first argument of a multi-argument function, ignoring the rest',
			input: 'json(a.b.field, some.path)',
			expected: 3,
		},
		{
			description:
				'counts relational segments from the first argument of a multi-argument function combined with before the function',
			input: 'a.b.json(c.d.field, some.path[0].nested)',
			expected: 5,
		},
	];

	test.each(testCases)('$description', ({ input, expected }) => {
		expect(getFieldRelationalDepth(input)).toBe(expected);
	});
});
