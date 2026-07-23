import { describe, expect, test } from 'vitest';
import { convertToJsonPath } from './dot-notation-path.js';

const TEST_CASES = [
	// Simple property access
	{ input: '.color', expected: '$.color', description: 'simple property access' },
	{ input: '.name', expected: '$.name', description: 'simple property access' },

	// Nested property access
	{ input: '.user.name', expected: '$.user.name', description: 'nested property access' },
	{
		input: '.data.settings.theme',
		expected: '$.data.settings.theme',
		description: 'deeply nested property access',
	},
	{ input: '.a.b.c.d', expected: '$.a.b.c.d', description: 'multiple nested levels' },

	// Array index access
	{ input: '.items[0]', expected: '$.items[0]', description: 'array index access' },
	{ input: '.items[123]', expected: '$.items[123]', description: 'array index with multi-digit number' },
	{ input: '[0]', expected: '$[0]', description: 'root array index' },

	// Mixed property and array access
	{ input: '.items[0].name', expected: '$.items[0].name', description: 'array index followed by property' },
	{
		input: '.users[0].profile.email',
		expected: '$.users[0].profile.email',
		description: 'complex nested path',
	},

	// Multiple array indices
	{ input: '.matrix[0][1]', expected: '$.matrix[0][1]', description: 'multiple array indices' },
	{ input: '.data[0][1][2]', expected: '$.data[0][1][2]', description: 'three array indices' },

	// Complex real-world scenarios
	{
		input: '.metadata.tags[0].value',
		expected: '$.metadata.tags[0].value',
		description: 'metadata with array and property',
	},
	{
		input: '.response.data.items[3].attributes.name',
		expected: '$.response.data.items[3].attributes.name',
		description: 'deeply nested with array in middle',
	},
	{ input: '.config.servers[0].host', expected: '$.config.servers[0].host', description: 'config with array access' },

	// Edge cases with underscore and numbers in property names
	{ input: '.user_data', expected: '$.user_data', description: 'property with underscore' },
	{
		input: '.first_name.last_name',
		expected: '$.first_name.last_name',
		description: 'nested properties with underscores',
	},
	{ input: '.test123.value', expected: '$.test123.value', description: 'property with numbers in name' },

	// Numeric segments are treated as array indices (consistent across dialects)
	{ input: '.0', expected: '$[0]', description: 'numeric segment becomes array index' },

	// Incomplete paths normalize consistently instead of producing broken output
	{ input: '.author.', expected: '$.author', description: 'incomplete trailing dot' },
	{ input: '.a..b', expected: '$.a.b', description: 'repeated dot' },
	{ input: 'a[.b]', expected: '$.a.b', description: 'malformed bracket with leading dot' },
];

describe('convertToJsonPath', () => {
	test.each(TEST_CASES)('converts "$input" to "$expected" ($description)', ({ input, expected }) => {
		expect(convertToJsonPath(input)).toBe(expected);
	});
});
