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

	// Array index access — integers are inlined as SQL literals (not bind parameters)
	// to ensure PostgreSQL picks the jsonb->integer overload, not jsonb->text.
	{ input: '.items[0]', template: '->?->0', bindings: ['items'], description: 'array index access' },
	{ input: '.items[5]', template: '->?->5', bindings: ['items'], description: 'array index with higher number' },
	{
		input: '.items[123]',
		template: '->?->123',
		bindings: ['items'],
		description: 'array index with multi-digit number',
	},

	// Mixed property and array access
	{
		input: '.items[0].name',
		template: '->?->0->?',
		bindings: ['items', 'name'],
		description: 'array index followed by property',
	},
	{
		input: '.data.items[0].name',
		template: '->?->?->0->?',
		bindings: ['data', 'items', 'name'],
		description: 'nested property, array, then property',
	},
	{
		input: '.users[0].profile.email',
		template: '->?->0->?->?',
		bindings: ['users', 'profile', 'email'],
		description: 'complex nested path',
	},

	// Multiple array indices
	{ input: '.matrix[0][1]', template: '->?->0->1', bindings: ['matrix'], description: 'multiple array indices' },
	{
		input: '.data[0][1][2]',
		template: '->?->0->1->2',
		bindings: ['data'],
		description: 'three array indices',
	},

	// Complex real-world scenarios
	{
		input: '.metadata.tags[0].value',
		template: '->?->?->0->?',
		bindings: ['metadata', 'tags', 'value'],
		description: 'metadata with array and property',
	},
	{
		input: '.response.data.items[3].attributes.name',
		template: '->?->?->?->3->?->?',
		bindings: ['response', 'data', 'items', 'attributes', 'name'],
		description: 'deeply nested with array in middle',
	},
	{
		input: '.config.servers[0].host',
		template: '->?->?->0->?',
		bindings: ['config', 'servers', 'host'],
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

describe('buildPostgresJsonPath (forFilter)', () => {
	test('single property uses ->> for filter', () => {
		expect(buildPostgresJsonPath('.color', true)).toEqual({ template: '->>?', bindings: ['color'] });
	});

	test('nested property uses -> for intermediate and ->> for final', () => {
		expect(buildPostgresJsonPath('.settings.theme', true)).toEqual({ template: '->?->>?', bindings: ['settings', 'theme'] });
	});

	test('array then property uses -> for intermediate and ->> for final', () => {
		expect(buildPostgresJsonPath('.items[0].name', true)).toEqual({ template: '->?->0->>?', bindings: ['items', 'name'] });
	});

	test('array index only uses ->> for filter', () => {
		expect(buildPostgresJsonPath('.items[0]', true)).toEqual({ template: '->?->>0', bindings: ['items'] });
	});
});
