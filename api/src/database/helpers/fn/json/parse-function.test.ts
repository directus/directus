import { describe, expect, test, vi } from 'vitest';
import { calculateJsonPathDepth, parseJsonFunction, parseJsonPath } from './parse-function.js';

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
	// Depth validation - exactly at limit (depth 10 is allowed)
	{
		input: 'json(data, a.b.c.d.e.f.g.h.i.j)',
		expected: { field: 'data', path: '.a.b.c.d.e.f.g.h.i.j' },
	},
	{
		input: 'json(data, items[0].a.b.c.d.e.f.g.h)',
		expected: { field: 'data', path: '.items[0].a.b.c.d.e.f.g.h' },
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
	// Unsupported path expressions
	{
		input: 'json(data, items[].name)',
		expectedError: 'Invalid query. Invalid JSON path: unsupported path expression.',
	},
	{ input: 'json(data, [])', expectedError: 'Invalid query. Invalid JSON path: unsupported path expression.' },
	{ input: 'json(data, *)', expectedError: 'Invalid query. Invalid JSON path: unsupported path expression.' },
	{
		input: 'json(data, items[*].name)',
		expectedError: 'Invalid query. Invalid JSON path: unsupported path expression.',
	},
	{ input: 'json(data, items.*)', expectedError: 'Invalid query. Invalid JSON path: unsupported path expression.' },
	{
		input: 'json(data, items[?(@.price > 10)])',
		expectedError: 'Invalid query. Invalid JSON path: unsupported path expression.',
	},
	{ input: 'json(data, ?.name)', expectedError: 'Invalid query. Invalid JSON path: unsupported path expression.' },
	{ input: 'json(data, @.name)', expectedError: 'Invalid query. Invalid JSON path: unsupported path expression.' },
	{ input: 'json(data, name$value)', expectedError: 'Invalid query. Invalid JSON path: unsupported path expression.' },
	{ input: 'json(data, $.name)', expectedError: 'Invalid query. Invalid JSON path: unsupported path expression.' },
	// Exceeds maximum depth (default is 10)
	{
		input: 'json(data, a.b.c.d.e.f.g.h.i.j.k)',
		expectedError: 'Invalid query. JSON path depth (11) exceeds allowed maximum of 10.',
	},
	{
		input: 'json(data, a[0].b[1].c[2].d[3].e[4].f[5])',
		expectedError: 'Invalid query. JSON path depth (12) exceeds allowed maximum of 10.',
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

	describe('parseJsonPath', () => {
		describe('valid inputs', () => {
			test.each([
				// Simple property — leading dot added
				{ input: 'color', expected: '.color' },
				{ input: 'settings.theme', expected: '.settings.theme' },
				{ input: 'a.b.c', expected: '.a.b.c' },
				// Starts with bracket — no leading dot added
				{ input: '[0]', expected: '[0]' },
				{ input: '[0].name', expected: '[0].name' },
				{ input: '[99]', expected: '[99]' },
				// Array index embedded in a path
				{ input: 'tags[0]', expected: '.tags[0]' },
				{ input: 'tags[1].name', expected: '.tags[1].name' },
				{ input: 'items[10].value', expected: '.items[10].value' },
				// Large but valid integer index
				{ input: 'data[1000]', expected: '.data[1000]' },
				// Multiple array accesses
				{ input: 'matrix[0][1]', expected: '.matrix[0][1]' },
				{ input: '[0][1][2]', expected: '[0][1][2]' },
				// Mixed property and array access
				{ input: 'items[0].nested[1].value', expected: '.items[0].nested[1].value' },
				// Exactly at depth limit (10 segments when normalized)
				{ input: 'a.b.c.d.e.f.g.h.i.j', expected: '.a.b.c.d.e.f.g.h.i.j' },
			])('normalizes "$input" to "$expected"', ({ input, expected }) => {
				expect(parseJsonPath(input)).toBe(expected);
			});
		});

		describe('invalid inputs — unsupported path expressions', () => {
			test.each([
				// Empty bracket subscript
				{ input: 'items[]', desc: 'empty bracket subscript' },
				{ input: '[]', desc: 'empty bracket alone' },
				{ input: 'a.b[]', desc: 'trailing empty bracket' },
				{ input: '[0][]', desc: 'empty bracket after valid index' },
				// Wildcard
				{ input: 'items[*]', desc: 'wildcard in bracket' },
				{ input: 'items.*', desc: 'dot-wildcard' },
				{ input: '*', desc: 'bare wildcard' },
				{ input: 'a.*.b', desc: 'wildcard in middle of path' },
				// JSONPath filter expression
				{ input: '?(color)', desc: 'filter expression ?' },
				{ input: 'items[?(@.price > 0)]', desc: 'filter predicate inside bracket' },
				{ input: '?.name', desc: 'leading ? character' },
				// Current-node reference
				{ input: '@.name', desc: 'current-node reference @' },
				{ input: 'a.@', desc: 'embedded @' },
				{ input: '@', desc: 'bare @ reference' },
				// Root reference
				{ input: '$.name', desc: 'root reference $' },
				{ input: 'name$value', desc: 'embedded $' },
				{ input: '$', desc: 'bare $ reference' },
				// Double dots (recursive descent — not supported)
				{ input: 'a..b', desc: 'double-dot recursive descent' },
				{ input: '..color', desc: 'leading double-dot' },
				{ input: 'a.b..c', desc: 'double-dot in middle' },
				// Negative array index
				{ input: 'items[-1]', desc: 'negative array index' },
				{ input: '[-1]', desc: 'leading negative array index' },
				{ input: 'a[-10].b', desc: 'negative index mid-path' },
			])('throws for $desc ("$input")', ({ input }) => {
				expect(() => parseJsonPath(input)).toThrow('Invalid JSON path: unsupported path expression');
			});
		});

		describe('invalid inputs — depth exceeded', () => {
			test('throws when path has 11 dot-segments (exceeds limit of 10)', () => {
				expect(() => parseJsonPath('a.b.c.d.e.f.g.h.i.j.k')).toThrow(
					'JSON path depth (11) exceeds allowed maximum of 10',
				);
			});

			test('throws when mixed array + dot accesses exceed limit', () => {
				// a[0].b[1].c[2].d[3].e[4].f[5] → depth 12
				expect(() => parseJsonPath('a[0].b[1].c[2].d[3].e[4].f[5]')).toThrow(
					'JSON path depth (12) exceeds allowed maximum of 10',
				);
			});
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
