import { describe, expect, test } from 'vitest';
import { parseFilterFunctionPath } from './parse-filter-function-path.js';

describe('parseFilterFunctionPath', () => {
	const testCases = [
		{
			description: 'parses an empty input',
			input: '',
			expected: '',
		},
		{
			description: 'parses strings without functions',
			input: 'noFunction',
			expected: 'noFunction',
		},
		{
			description: 'parses strings without functions (nested path)',
			input: 'a.b.noFunction',
			expected: 'a.b.noFunction',
		},
		{
			description: 'parses functions without nested columns',
			input: 'function(field)',
			expected: 'function(field)',
		},
		{
			description: 'parses functions with multiple arguments',
			input: 'function(field, path)',
			expected: 'function(field, path)',
		},
		{
			description: 'parses functions with nested columns',
			input: 'function(a.b.field)',
			expected: 'a.b.function(field)',
		},
		{
			description: 'parses nested functions without nested columns',
			input: 'a.b.function(field)',
			expected: 'a.b.function(field)',
		},
		{
			description: 'parses nested functions with nested columns',
			input: 'a.b.function(c.d.field)',
			expected: 'a.b.c.d.function(field)',
		},
		{
			description: 'parses nested functions with multiple arguments',
			input: 'a.b.function(c.d.field, json.path)',
			expected: 'a.b.c.d.function(field, json.path)',
		},
		{
			description: 'returns path unchanged when function name is missing',
			input: '(a.b.field)',
			expected: '(a.b.field)',
		},
		{
			description: 'returns path unchanged when arg contains nested parens',
			input: 'outer(inner(a.b.field))',
			expected: 'outer(inner(a.b.field))',
		},
		{
			description: 'ignores a comma that appears before the opening paren',
			input: 'a,b.function(field)',
			expected: 'a,b.function(field)',
		},
	];

	test.each(testCases)('$description', ({ input, expected }) => {
		expect(parseFilterFunctionPath(input)).toBe(expected);
	});
});
