import { describe, expect, test } from 'vitest';
import { parseJsonFunction, parseWildcardPath } from './parse-function.js';

const VALID_TEST_CASES = [
	// Basic json(field, path) syntax
	{ input: 'json(field, path)', expected: { field: 'field', path: '.path', hasWildcard: false } },
	{ input: 'json(data, user.name)', expected: { field: 'data', path: '.user.name', hasWildcard: false } },
	{ input: 'json(metadata, settings.theme.color)', expected: { field: 'metadata', path: '.settings.theme.color', hasWildcard: false } },
	{ input: 'json(  field , path  )', expected: { field: 'field', path: '.path', hasWildcard: false } },
	{ input: 'json(user_data, profile)', expected: { field: 'user_data', path: '.profile', hasWildcard: false } },
	// Array access with index
	{ input: 'json(data, items[0].name)', expected: { field: 'data', path: '.items[0].name', hasWildcard: false } },
	{ input: 'json(data, [0].name)', expected: { field: 'data', path: '[0].name', hasWildcard: false } },
	{ input: 'json(data, [0])', expected: { field: 'data', path: '[0]', hasWildcard: false } },
	// Relational fields with JSON path
	{ input: 'json(author.profile, settings.theme)', expected: { field: 'author.profile', path: '.settings.theme', hasWildcard: false } },
	{ input: 'json(category.parent.metadata, icon)', expected: { field: 'category.parent.metadata', path: '.icon', hasWildcard: false } },
	// A2O relational fields with collection scoping (colon preserved in field portion)
	{ input: 'json(relation.item:collection.field, path)', expected: { field: 'relation.item:collection.field', path: '.path', hasWildcard: false } },
	// Array wildcard syntax
	{ input: 'json(data, items[].name)', expected: { field: 'data', path: '.items[].name', hasWildcard: true } },
	{ input: 'json(data, items[])', expected: { field: 'data', path: '.items[]', hasWildcard: true } },
	{ input: 'json(data, [].name)', expected: { field: 'data', path: '[].name', hasWildcard: true } },
	{ input: 'json(data, nested[].items[].value)', expected: { field: 'data', path: '.nested[].items[].value', hasWildcard: true } },
	{ input: 'json(meta, variants[].options[].label)', expected: { field: 'meta', path: '.variants[].options[].label', hasWildcard: true } },
];

const INVALID_TEST_CASES = [
	{ input: 'field, path)', expectedError: 'Invalid json() syntax' },
	{ input: 'json(field, path', expectedError: 'Invalid json() syntax' },
	{ input: 'json()', expectedError: 'Invalid json() syntax' },
	{ input: 'json(   )', expectedError: 'Invalid json() syntax' },
	{ input: ' json()', expectedError: 'Invalid json() syntax' },
	{ input: 'json() ', expectedError: 'Invalid json() syntax' },
	// Missing comma delimiter
	{ input: 'json(fieldonly)', expectedError: 'Invalid json() syntax: requires json(field, path) format' },
	{ input: 'json(field.path.no.comma)', expectedError: 'Invalid json() syntax: requires json(field, path) format' },
	// Missing field name
	{ input: 'json(, path)', expectedError: 'Invalid json() syntax: missing field name' },
	// Missing path
	{ input: 'json(field,)', expectedError: 'Invalid json() syntax: missing path' },
];

describe('JsonHelper', () => {
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

	describe('parseWildcardPath', () => {
		test('parses ".items[].name" correctly', () => {
			expect(parseWildcardPath('.items[].name')).toEqual({
				arrayPath: '$.items',
				valuePath: '$.name',
			});
		});

		test('parses ".items[]" correctly (no value path)', () => {
			expect(parseWildcardPath('.items[]')).toEqual({
				arrayPath: '$.items',
				valuePath: '$',
			});
		});

		test('parses "[].name" correctly (root array)', () => {
			expect(parseWildcardPath('[].name')).toEqual({
				arrayPath: '$',
				valuePath: '$.name',
			});
		});

		test('parses ".nested.items[].value" correctly', () => {
			expect(parseWildcardPath('.nested.items[].value')).toEqual({
				arrayPath: '$.nested.items',
				valuePath: '$.value',
			});
		});

		test('parses ".items[].nested.value" correctly', () => {
			expect(parseWildcardPath('.items[].nested.value')).toEqual({
				arrayPath: '$.items',
				valuePath: '$.nested.value',
			});
		});

		test('throws for path without wildcard', () => {
			expect(() => parseWildcardPath('.items[0].name')).toThrow('Path does not contain wildcard');
		});
	});
});
