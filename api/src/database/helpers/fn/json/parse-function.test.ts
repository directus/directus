import { describe, expect, test, vi } from 'vitest';
import { calculateJsonPathDepth, parseJsonFunction } from './parse-function.js';

vi.mock('@directus/env', () => ({
	useEnv: vi.fn().mockReturnValue({
		MAX_JSON_QUERY_DEPTH: 10,
	}),
}));

const VALID_TEST_CASES = [
	// Basic json(field, path) syntax
	{ input: 'json(field, path)', expected: { field: 'field', path: '.path' } },
	{ input: 'json(data, user.name)', expected: { field: 'data', path: '.user.name' } },
	{
		input: 'json(metadata, settings.theme.color)',
		expected: { field: 'metadata', path: '.settings.theme.color' },
	},
	{ input: 'json(  field , path  )', expected: { field: 'field', path: '.path' } },
	{ input: 'json(user_data, profile)', expected: { field: 'user_data', path: '.profile' } },
	// Array access with index
	{ input: 'json(data, items[0].name)', expected: { field: 'data', path: '.items[0].name' } },
	{ input: 'json(data, [0].name)', expected: { field: 'data', path: '[0].name' } },
	{ input: 'json(data, [0])', expected: { field: 'data', path: '[0]' } },
	// Relational fields with JSON path
	{
		input: 'json(author.profile, settings.theme)',
		expected: { field: 'author.profile', path: '.settings.theme' },
	},
	{
		input: 'json(category.parent.metadata, icon)',
		expected: { field: 'category.parent.metadata', path: '.icon' },
	},
	// A2O relational fields with collection scoping (colon preserved in field portion)
	{
		input: 'json(relation.item:collection.field, path)',
		expected: { field: 'relation.item:collection.field', path: '.path' },
	},
	// Depth validation - exactly at limit (depth 10 is allowed)
	{
		input: 'json(data, a.b.c.d.e.f.g.h.i.j)',
		expected: { field: 'data', path: '.a.b.c.d.e.f.g.h.i.j' },
	},
	{
		input: 'json(data, items[0].a.b.c.d.e.f.g.h)',
		expected: { field: 'data', path: '.items[0].a.b.c.d.e.f.g.h' },
	},
	// Relational fields should NOT count toward JSON path depth
	{
		input: 'json(a.b.c.d.e.f.g.h.i.j, color)',
		expected: { field: 'a.b.c.d.e.f.g.h.i.j', path: '.color' },
	},
	{
		input: 'json(deep.nested.relation.field, a.b.c.d.e.f.g.h.i.j)',
		expected: { field: 'deep.nested.relation.field', path: '.a.b.c.d.e.f.g.h.i.j' },
	},
	{
		input: 'json(a.b.c.d.e.f.g.h.i:collection.j.k.l, simple)',
		expected: { field: 'a.b.c.d.e.f.g.h.i:collection.j.k.l', path: '.simple' },
	},
];

const INVALID_TEST_CASES = [
	{ input: 'field, path)', expectedError: 'Invalid json() syntax' },
	{ input: 'json(field, path', expectedError: 'Invalid json() syntax' },
	{ input: 'json()', expectedError: 'Invalid json() syntax' },
	{ input: 'json(   )', expectedError: 'Invalid json() syntax' },
	{ input: ' json()', expectedError: 'Invalid json() syntax' },
	{ input: 'json() ', expectedError: 'Invalid json() syntax' },
	{ input: 'json(,,) ', expectedError: 'Invalid json() syntax' },
	// Missing comma delimiter
	{ input: 'json(fieldonly)', expectedError: 'Invalid json() syntax: requires json(field, path) format' },
	{ input: 'json(field.path.no.comma)', expectedError: 'Invalid json() syntax: requires json(field, path) format' },
	// Missing field name
	{ input: 'json(, path)', expectedError: 'Invalid json() syntax: missing field name' },
	{ input: 'json( , path)', expectedError: 'Invalid json() syntax: missing field name' },
	// Missing path
	{ input: 'json(field,)', expectedError: 'Invalid json() syntax: missing path' },
	// Exceeds maximum depth (default is 10)
	{
		input: 'json(data, a.b.c.d.e.f.g.h.i.j.k)',
		expectedError: 'JSON path depth exceeds maximum allowed depth of 10 (got 11)',
	},
	{
		input: 'json(data, a[0].b[1].c[2].d[3].e[4].f[5])',
		expectedError: 'JSON path depth exceeds maximum allowed depth of 10',
	},
	// Relational field depth does NOT offset the limit — only JSON path counts
	{
		input: 'json(deep.nested.relation.field, a.b.c.d.e.f.g.h.i.j.k)',
		expectedError: 'JSON path depth exceeds maximum allowed depth of 10 (got 11)',
	},
	{
		input: 'json(a.b.c:collection.d.e, x[0].y[1].z[2].w[3].v[4].u[5])',
		expectedError: 'JSON path depth exceeds maximum allowed depth of 10',
	},
];

const JSON_PATH_DEPTH_TEST_CASES = [
	// Empty string
	{ path: '', expected: 0 },
	// Single property access
	{ path: '.color', expected: 1 },
	{ path: 'color', expected: 0 },
	// Nested property access
	{ path: '.settings.theme', expected: 2 },
	{ path: '.a.b.c', expected: 3 },
	{ path: '.a.b.c.d.e.f.g.h.i.j', expected: 10 },
	// Array access
	{ path: '[0]', expected: 1 },
	{ path: '.items[0]', expected: 2 },
	{ path: '[0][1]', expected: 2 },
	// Mixed property and array access
	{ path: '.items[0].name', expected: 3 },
	{ path: '.data[0].nested[1].value', expected: 5 },
	{ path: '.a.b[0].c[1].d', expected: 6 },
	// Complex paths
	{ path: '.a.b.c.d.e.f.g.h.i.j.k', expected: 11 },
	{ path: '.a[0].b[1].c[2].d[3].e[4].f[5]', expected: 12 },
	// Paths without leading dot
	{ path: 'a.b.c', expected: 2 },
	{ path: 'items[0].name', expected: 2 },
];

describe('JsonHelper', () => {
	describe('calculateJsonPathDepth', () => {
		test.each(JSON_PATH_DEPTH_TEST_CASES)('returns $expected for "$path"', ({ path, expected }) => {
			expect(calculateJsonPathDepth(path)).toBe(expected);
		});
	});

	describe('parseJsonFunction', () => {
		describe('valid inputs', () => {
			test.each(VALID_TEST_CASES)(
				'parses "$input" to field="$expected.field" path="$expected.path"',
				({ input, expected }) => {
					expect(parseJsonFunction(input)).toEqual(expected);
				},
			);
		});

		describe('invalid inputs', () => {
			test.each(INVALID_TEST_CASES)('throws for "$input"', ({ input, expectedError }) => {
				expect(() => parseJsonFunction(input)).toThrow(expectedError);
			});
		});
	});
});
