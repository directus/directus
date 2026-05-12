import { describe, expect, test } from 'vitest';
import { GraphQLJsonFilter } from './json-filter.js';

const validCases: [string, unknown][] = [
	['plain filter object', { color: { _eq: 'red' }, size: { _gt: 5 } }],
	['_or with array of filter objects', { _or: [{ color: { _eq: 'red' } }, { size: { _gt: 5 } }] }],
	['_and with array of filter objects', { _and: [{ color: { _eq: 'red' } }, { size: { _lt: 10 } }] }],
];

const invalidCases: [string, unknown, string][] = [
	['non-object value', 'string', 'json filter value must be a plain object mapping JSON path keys to filter operators'],
	['null', null, 'json filter value must be a plain object mapping JSON path keys to filter operators'],
	[
		'array',
		[{ color: { _eq: 'red' } }],
		'json filter value must be a plain object mapping JSON path keys to filter operators',
	],
	['_or not an array', { _or: { color: { _eq: 'red' } } }, 'json filter: "_or" must be an array of filter objects'],
	['_and not an array', { _and: 'bad' }, 'json filter: "_and" must be an array of filter objects'],
	[
		'non-object operator value',
		{ color: 'red' },
		'json filter: "color" must be a filter operator object (e.g. { "_eq": "value" })',
	],
	[
		'array as operator value',
		{ color: ['red'] },
		'json filter: "color" must be a filter operator object (e.g. { "_eq": "value" })',
	],
	['empty string key', { '': { _eq: 'value' } }, 'json filter: keys must not be empty'],
	['whitespace-only key', { '   ': { _eq: 'value' } }, 'json filter: keys must not be empty'],
];

describe('GraphQLJsonFilter.parseValue', () => {
	test.each(validCases)('accepts %s', (_label, value) => {
		expect(GraphQLJsonFilter.parseValue(value)).toEqual(value);
	});

	test.each(invalidCases)('rejects %s', (_label, value, expectedError) => {
		expect(() => GraphQLJsonFilter.parseValue(value)).toThrow(expectedError);
	});
});
