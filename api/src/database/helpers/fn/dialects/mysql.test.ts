import { describe, expect, test, vi } from 'vitest';
import { convertToMySQLPath, splitJsonPath } from './mysql.js';

// Mock dependencies to avoid loading the full FnHelper class
vi.mock('../types.js', () => ({
	FnHelper: class FnHelper {},
	FnHelperOptions: {},
}));

vi.mock('../json/parse-function.js', () => ({
	parseJsonFunction: vi.fn(),
}));

const TEST_CASES = [
	// Simple property access
	{ input: '.color', expected: "$['color']", description: 'simple property access' },
	{ input: '.name', expected: "$['name']", description: 'simple property access' },

	// Nested property access
	{ input: '.user.name', expected: "$['user']['name']", description: 'nested property access' },
	{
		input: '.data.settings.theme',
		expected: "$['data']['settings']['theme']",
		description: 'deeply nested property access',
	},
	{ input: '.a.b.c.d', expected: "$['a']['b']['c']['d']", description: 'multiple nested levels' },

	// Array index access
	{ input: '.items[0]', expected: "$['items'][0]", description: 'array index access' },
	{ input: '.items[5]', expected: "$['items'][5]", description: 'array index with higher number' },
	{ input: '.items[123]', expected: "$['items'][123]", description: 'array index with multi-digit number' },

	// Mixed property and array access
	{ input: '.items[0].name', expected: "$['items'][0]['name']", description: 'array index followed by property' },
	{
		input: '.data.items[0].name',
		expected: "$['data']['items'][0]['name']",
		description: 'nested property, array, then property',
	},
	{
		input: '.users[0].profile.email',
		expected: "$['users'][0]['profile']['email']",
		description: 'complex nested path',
	},

	// Multiple array indices
	{ input: '.matrix[0][1]', expected: "$['matrix'][0][1]", description: 'multiple array indices' },
	{ input: '.data[0][1][2]', expected: "$['data'][0][1][2]", description: 'three array indices' },

	// Complex real-world scenarios
	{
		input: '.metadata.tags[0].value',
		expected: "$['metadata']['tags'][0]['value']",
		description: 'metadata with array and property',
	},
	{
		input: '.response.data.items[3].attributes.name',
		expected: "$['response']['data']['items'][3]['attributes']['name']",
		description: 'deeply nested with array in middle',
	},
	{
		input: '.config.servers[0].host',
		expected: "$['config']['servers'][0]['host']",
		description: 'config with array access',
	},

	// Edge cases with underscore and special characters
	{ input: '.user_data', expected: "$['user_data']", description: 'property with underscore' },
	{
		input: '.first_name.last_name',
		expected: "$['first_name']['last_name']",
		description: 'nested properties with underscores',
	},

	// Edge cases with numbers in property names
	{ input: '.item1', expected: "$['item1']", description: 'property with number suffix' },
	{ input: '.test123.value', expected: "$['test123']['value']", description: 'property with numbers in name' },
];

const WILDCARD_TEST_CASES = [
	{ input: '.items[].name', expected: "$['items'][*]['name']", description: 'simple wildcard path' },
	{ input: '.items[]', expected: "$['items'][*]", description: 'wildcard at end of path' },
	{ input: '.data.items[].value', expected: "$['data']['items'][*]['value']", description: 'nested wildcard' },
	{
		input: '.items[].nested[].value',
		expected: "$['items'][*]['nested'][*]['value']",
		description: 'multiple wildcards',
	},
	{ input: '[].name', expected: "$[*]['name']", description: 'root array wildcard' },
];

const SPLIT_PATH_TEST_CASES = [
	{ input: '.color', expected: ['color'], description: 'simple property path' },
	{ input: '.user.name', expected: ['user', 'name'], description: 'nested property path' },
	{ input: '.items[0]', expected: ['items', '0'], description: 'path with array index' },
	{ input: '.items[0].name', expected: ['items', '0', 'name'], description: 'array index and property' },
	{
		input: '.data.items[0].nested[1].value',
		expected: ['data', 'items', '0', 'nested', '1', 'value'],
		description: 'complex nested path',
	},
	{ input: '[0].name', expected: ['0', 'name'], description: 'path starting with bracket' },
	{ input: '.matrix[0][1]', expected: ['matrix', '0', '1'], description: 'consecutive brackets' },
	{ input: '.user_data.first_name', expected: ['user_data', 'first_name'], description: 'properties with underscores' },
];

describe('convertToMySQLPath', () => {
	test.each(TEST_CASES)('converts "$input" to "$expected" ($description)', ({ input, expected }) => {
		expect(convertToMySQLPath(input)).toBe(expected);
	});

	describe('with wildcards', () => {
		test.each(WILDCARD_TEST_CASES)('converts "$input" to "$expected" ($description)', ({ input, expected }) => {
			expect(convertToMySQLPath(input, true)).toBe(expected);
		});
	});
});

describe('splitJsonPath', () => {
	test.each(SPLIT_PATH_TEST_CASES)('$description: "$input"', ({ input, expected }) => {
		expect(splitJsonPath(input)).toEqual(expected);
	});
});
