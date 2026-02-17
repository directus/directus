import { describe, expect, test } from 'vitest';
import { parseJsonFunction } from './parse-function.js';

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
});
