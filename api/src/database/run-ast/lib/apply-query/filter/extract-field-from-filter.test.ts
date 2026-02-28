import type { Filter } from '@directus/types';
import { describe, expect, test } from 'vitest';
import { extractFieldFromFilter } from './extract-field-from-filter.js';

describe('extractFieldFromFilter', () => {
	test('returns null if filter is not an object or null', () => {
		expect(extractFieldFromFilter('invalid' as unknown as Filter, 'field')).toBe(null);

		expect(extractFieldFromFilter(null as unknown as Filter, 'field')).toBe(null);
	});

	test('returns null if filter object does not have the specified field', () => {
		const filter: Filter = { foo: { _eq: 'bar' } };
		expect(extractFieldFromFilter(filter, 'baz')).toBe(null);
	});

	test('returns null if filter object is not a FieldFilter or LogicalFilter', () => {
		const filter = { foo: { bar: 'baz' } } as unknown as Filter;
		expect(extractFieldFromFilter(filter, 'bar')).toEqual(null);
	});

	test('returns a new filter object with only the specified field and its children', () => {
		const filter: Filter = {
			_and: [{ foo: { _eq: 'bar' } }, { baz: { bar: { _gt: 10 } } }],
			qux: { _neq: 'quux' },
		};

		const expected = {
			bar: { _gt: 10 },
		};

		expect(extractFieldFromFilter(filter, 'baz')).toEqual(expected);
	});

	test('handles nested filter objects correctly even though the filter might not be logical', () => {
		const filter: Filter = {
			_and: [{ foo: { bar: { _eq: 'baz' } } }, { foo: { baz: { _neq: 'quux' } } }],
		};

		const expected = { _neq: 'quux' };

		expect(extractFieldFromFilter(filter, 'baz')).toEqual(expected);
	});

	test('handles multiple nested filter objects correctly by grouping within _and', () => {
		const filter: Filter = {
			_and: [{ baz: { foo: { _gt: 10 } } }, { baz: { foo: { _neq: 'quux' } } }],
		};

		const expected = {
			_and: [{ foo: { _gt: 10 } }, { foo: { _neq: 'quux' } }],
		};

		expect(extractFieldFromFilter(filter, 'baz')).toEqual(expected);
	});

	test('handles multiple or filters objects correctly', () => {
		const filter: Filter = {
			_or: [{ baz: { foo: { _gt: 10 } } }, { baz: { foo: { _neq: 'quux' } } }],
			baz: { bar: { _gt: 10 } },
		};

		const expected = {
			_and: [{ _or: [{ foo: { _gt: 10 } }, { foo: { _neq: 'quux' } }] }, { bar: { _gt: 10 } }],
		};

		expect(extractFieldFromFilter(filter, 'baz')).toEqual(expected);
	});
});
