import { describe, expect, test } from 'vitest';
import { getOperation } from './get-operation.js';

describe('getOperation', () => {
	test('should return the operator and value of a field filter', () => {
		expect(getOperation('title', { _neq: 'a' })).toEqual({ operator: '_neq', value: 'a' });
	});

	test('should follow nested fields down to the operator', () => {
		expect(getOperation('author', { role: { name: { _in: ['a', 'b'] } } })).toEqual({
			operator: '_in',
			value: ['a', 'b'],
		});
	});

	test('should treat a function key like a field', () => {
		expect(getOperation('year(release)', { _eq: 2020 })).toEqual({ operator: '_eq', value: 2020 });
	});

	test('should return the key itself when it is an operator', () => {
		expect(getOperation('_gt', 1)).toEqual({ operator: '_gt', value: 1 });
	});

	test.each([
		['_json', { level: { _gt: 1 } }],
		['_intersects', { type: 'Point', coordinates: [1, 2] }],
	])('should return %s with its whole value without walking into it', (operator, value) => {
		expect(getOperation('metadata', { [operator]: value })).toEqual({ operator, value });
	});

	test.each([
		['a string', 'a'],
		['a number', 1],
		['false', false],
		['null', null],
	])('should default to _eq for %s as a direct value', (_, value) => {
		expect(getOperation('title', value)).toEqual({ operator: '_eq', value });
	});

	test('should default to _eq for a nested direct value', () => {
		expect(getOperation('author', { name: 'a' })).toEqual({ operator: '_eq', value: 'a' });
	});

	test('should only follow the first key at each level', () => {
		expect(getOperation('title', { _eq: 'a', _neq: 'b' })).toEqual({ operator: '_eq', value: 'a' });
	});

	const nonFieldOperators: [string, unknown][] = [
		['_and', [{ name: { _eq: 'a' } }]],
		['_or', [{ name: { _eq: 'a' } }]],
		['_some', { name: { _eq: 'a' } }],
		['_none', { name: { _eq: 'a' } }],
	];

	test.each(nonFieldOperators)('should return null for %s', (key, value) => {
		expect(getOperation(key, value)).toBeNull();
	});

	test.each(nonFieldOperators)('should return null for a nested %s', (key, value) => {
		expect(getOperation('author', { [key]: value })).toBeNull();
	});

	test('should return null for an empty filter', () => {
		expect(getOperation('title', {})).toBeNull();
	});

	test('should return null for a nested empty filter', () => {
		expect(getOperation('author', { name: {} })).toBeNull();
	});
});
