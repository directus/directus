import { describe, expect, test } from 'vitest';
import { splitFields } from './split-fields.js';

const VALID_TEST_CASES = [
	// Single field
	{ input: 'a', expected: ['a'] },
	// Two fields
	{ input: 'a,b', expected: ['a', 'b'] },
	// Three fields
	{ input: 'a,b,c', expected: ['a', 'b', 'c'] },
	// Many fields
	{ input: 'a,b,c,d,e', expected: ['a', 'b', 'c', 'd', 'e'] },
	// Empty string produces a single empty-string field
	{ input: '', expected: [''] },
	// Just a comma produces two empty-string fields
	{ input: ',', expected: ['', ''] },
	// Two commas produce three empty-string fields
	{ input: ',,', expected: ['', '', ''] },
	// Temporal/date functions
	{ input: 'week(created_at),day(created_at)', expected: ['week(created_at)', 'day(created_at)'] },
	{ input: 'year(date),month(date),day(date)', expected: ['year(date)', 'month(date)', 'day(date)'] },
	{ input: 'hour(timestamp),minute(timestamp)', expected: ['hour(timestamp)', 'minute(timestamp)'] },
	// count() function
	{ input: 'count(tags)', expected: ['count(tags)'] },
	{ input: 'id,count(tags)', expected: ['id', 'count(tags)'] },
	// Function with more than two params
	{ input: 'fn(a,b,c)', expected: ['fn(a,b,c)'] },
	// json() — path with dots
	{ input: 'json(data,user.name)', expected: ['json(data,user.name)'] },
	{ input: 'json(metadata,settings.theme.color)', expected: ['json(metadata,settings.theme.color)'] },
	// json() — path with square brackets (array index access)
	{ input: 'json(data,items[0])', expected: ['json(data,items[0])'] },
	{ input: 'json(data,items[0].name)', expected: ['json(data,items[0].name)'] },
	{ input: 'json(data,[0])', expected: ['json(data,[0])'] },
	{ input: 'json(data,[0].label)', expected: ['json(data,[0].label)'] },
	// json() mixed with plain fields
	{ input: 'id,json(meta,colors[0]),status', expected: ['id', 'json(meta,colors[0])', 'status'] },
	{ input: 'json(a,b),json(c,d)', expected: ['json(a,b)', 'json(c,d)'] },
	{ input: 'a,json(b,c)', expected: ['a', 'json(b,c)'] },
	{ input: 'json(a,b),c', expected: ['json(a,b)', 'c'] },
	{ input: 'a,json(b,c),d', expected: ['a', 'json(b,c)', 'd'] },
	// Relational — one level deep
	{ input: 'author.name,author.email', expected: ['author.name', 'author.email'] },
	// Relational — two levels deep
	{ input: 'author.role.name', expected: ['author.role.name'] },
	// Relational — three levels deep
	{ input: 'a.b.c.d', expected: ['a.b.c.d'] },
	// Relational wildcard
	{ input: 'author.*', expected: ['author.*'] },
	{ input: 'author.role.*', expected: ['author.role.*'] },
	// Mix of relational fields and functions
	{ input: 'author.name,count(tags),week(created_at)', expected: ['author.name', 'count(tags)', 'week(created_at)'] },
	{ input: 'category.slug,json(meta,og.title),status', expected: ['category.slug', 'json(meta,og.title)', 'status'] },
	// Wildcards
	{ input: '*', expected: ['*'] },
	{ input: 'items.*', expected: ['items.*'] },
	// Underscores in field names
	{ input: 'field_name,another_field', expected: ['field_name', 'another_field'] },
	// Spaces are preserved verbatim (splitFields does not trim)
	{ input: 'a , b', expected: ['a ', ' b'] },
	// Empty parens — depth opens then closes, treated as a single token
	{ input: '()', expected: ['()'] },
	// Comma inside parens when no function name precedes them
	{ input: '(,)', expected: ['(,)'] },
];

const INVALID_TEST_CASES = [
	// Nested function call
	{ input: 'json(a(b),c)', expectedError: 'Nested functions are not supported in "fields"' },
	{ input: 'a(b(c))', expectedError: 'Nested functions are not supported in "fields"' },
	{ input: '((a))', expectedError: 'Nested functions are not supported in "fields"' },
	// json() inside another json() is also a nested call
	{ input: 'json(data,tags[0],json(data,tags[1]))', expectedError: 'Nested functions are not supported in "fields"' },
	{ input: 'count(week(created_at))', expectedError: 'Nested functions are not supported in "fields"' },
	// Unclosed opening parenthesis
	{ input: 'json(a,b', expectedError: 'Missing closing parenthesis in "fields"' },
	{ input: 'a,json(b', expectedError: 'Missing closing parenthesis in "fields"' },
	{ input: '(', expectedError: 'Missing closing parenthesis in "fields"' },
	// Extra / unmatched closing parenthesis
	{ input: 'a)', expectedError: 'Missing closing parenthesis in "fields"' },
	{ input: 'json(a,b))', expectedError: 'Missing closing parenthesis in "fields"' },
	{ input: ')', expectedError: 'Missing closing parenthesis in "fields"' },
];

describe('splitFields', () => {
	describe('valid inputs', () => {
		test.each(VALID_TEST_CASES)('correctly splits "$input"', ({ input, expected }) => {
			expect(splitFields(input)).toEqual(expected);
		});
	});

	describe('invalid inputs', () => {
		test.each(INVALID_TEST_CASES)('throws for "$input"', ({ input, expectedError }) => {
			expect(() => splitFields(input)).toThrow(expectedError);
		});
	});
});
