import { describe, expect, test, vi } from 'vitest';
import { buildPostgresJsonPath } from './postgres.js';

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
	{ input: '.color', template: '->?', bindings: ['color'], description: 'simple property access' },
	{ input: '.name', template: '->?', bindings: ['name'], description: 'simple property access' },

	// Nested property access
	{ input: '.user.name', template: '->?->?', bindings: ['user', 'name'], description: 'nested property access' },
	{
		input: '.data.settings.theme',
		template: '->?->?->?',
		bindings: ['data', 'settings', 'theme'],
		description: 'deeply nested property access',
	},
	{
		input: '.a.b.c.d',
		template: '->?->?->?->?',
		bindings: ['a', 'b', 'c', 'd'],
		description: 'multiple nested levels',
	},

	// Array index access
	{ input: '.items[0]', template: '->?->?', bindings: ['items', 0], description: 'array index access' },
	{ input: '.items[5]', template: '->?->?', bindings: ['items', 5], description: 'array index with higher number' },
	{
		input: '.items[123]',
		template: '->?->?',
		bindings: ['items', 123],
		description: 'array index with multi-digit number',
	},

	// Mixed property and array access
	{
		input: '.items[0].name',
		template: '->?->?->?',
		bindings: ['items', 0, 'name'],
		description: 'array index followed by property',
	},
	{
		input: '.data.items[0].name',
		template: '->?->?->?->?',
		bindings: ['data', 'items', 0, 'name'],
		description: 'nested property, array, then property',
	},
	{
		input: '.users[0].profile.email',
		template: '->?->?->?->?',
		bindings: ['users', 0, 'profile', 'email'],
		description: 'complex nested path',
	},

	// Multiple array indices
	{ input: '.matrix[0][1]', template: '->?->?->?', bindings: ['matrix', 0, 1], description: 'multiple array indices' },
	{
		input: '.data[0][1][2]',
		template: '->?->?->?->?',
		bindings: ['data', 0, 1, 2],
		description: 'three array indices',
	},

	// Complex real-world scenarios
	{
		input: '.metadata.tags[0].value',
		template: '->?->?->?->?',
		bindings: ['metadata', 'tags', 0, 'value'],
		description: 'metadata with array and property',
	},
	{
		input: '.response.data.items[3].attributes.name',
		template: '->?->?->?->?->?->?',
		bindings: ['response', 'data', 'items', 3, 'attributes', 'name'],
		description: 'deeply nested with array in middle',
	},
	{
		input: '.config.servers[0].host',
		template: '->?->?->?->?',
		bindings: ['config', 'servers', 0, 'host'],
		description: 'config with array access',
	},

	// Edge cases with underscore and special characters
	{ input: '.user_data', template: '->?', bindings: ['user_data'], description: 'property with underscore' },
	{
		input: '.first_name.last_name',
		template: '->?->?',
		bindings: ['first_name', 'last_name'],
		description: 'nested properties with underscores',
	},
];

describe('buildPostgresJsonPath', () => {
	test.each(TEST_CASES)('converts "$input" ($description)', ({ input, template, bindings }) => {
		expect(buildPostgresJsonPath(input)).toEqual({ template, bindings });
	});
});
