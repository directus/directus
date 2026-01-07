import type { Filter } from '@directus/types';
import { describe, expect, it, test } from 'vitest';
import { validatePayload } from './validate-payload.js';

describe('validatePayload', () => {
	it('returns an empty array when there are no errors', () => {
		const mockFilter = { _and: [{ field: { _eq: 'field' } }] } as Filter;
		const mockPayload = { field: 'field' };
		expect(validatePayload(mockFilter, mockPayload)).toStrictEqual([]);
	});

	it('returns an array of 1 when there errors with an _and operator', () => {
		const mockFilter = { _and: [{ field: { _eq: 'field' } }] } as Filter;
		const mockPayload = { field: 'test' };
		expect(validatePayload(mockFilter, mockPayload)).toHaveLength(1);
	});

	it('returns an array of 1 when there errors with an _or operator', () => {
		const mockFilter = { _or: [{ field: { _eq: 'field' } }] } as Filter;
		const mockPayload = { field: 'test' };
		expect(validatePayload(mockFilter, mockPayload)).toHaveLength(1);
	});

	it('returns an array of 1 when there errors with an _or containing _and operators', () => {
		const mockFilter = {
			_or: [
				{
					_and: [{ a: { _eq: 1 } }, { b: { _eq: 1 } }],
				},
				{
					_and: [{ a: { _eq: 2 } }, { b: { _eq: 2 } }],
				},
			],
		} as Filter;

		expect(
			validatePayload(mockFilter, {
				a: 0,
				b: 0,
			}),
		).toHaveLength(4);

		expect(
			validatePayload(mockFilter, {
				a: 0,
				b: 1,
			}),
		).toHaveLength(3);

		expect(
			validatePayload(mockFilter, {
				a: 1,
				b: 2,
			}),
		).toHaveLength(2);

		expect(
			validatePayload(mockFilter, {
				a: 1,
				b: 1,
			}),
		).toHaveLength(0);

		expect(
			validatePayload(mockFilter, {
				a: 2,
				b: 2,
			}),
		).toHaveLength(0);
	});

	it('returns an empty array when there is no error for filter field that does not exist in payload ', () => {
		const mockFilter = { field: { _eq: 'field' } } as Filter;
		// intentionally empty payload to simulate "field" was never included in payload
		const mockPayload = {};

		expect(validatePayload(mockFilter, mockPayload)).toHaveLength(0);
	});

	it('returns an array of 1 when there is required error for filter field that does not exist in payload and requireAll option flag is true', () => {
		const mockFilter = { field: { _eq: 'field' } } as Filter;
		// intentionally empty payload to simulate "field" was never included in payload
		const mockPayload = {};

		const errors = validatePayload(mockFilter, mockPayload, { requireAll: true });

		expect(errors).toHaveLength(1);
		expect(errors[0]!.message).toBe(`"field" is required`);
	});

	describe('validates operator: _contains', () => {
		const mockFilter = {
			_and: [
				{
					value: {
						_contains: 'MATCH-EXACT',
					},
				},
			],
		};

		const options = { requireAll: true };

		test('string values', () => {
			expect(validatePayload(mockFilter, { value: 'MATCH-EXACT' }, options)).toHaveLength(0);
			expect(validatePayload(mockFilter, { value: 'substring-MATCH-EXACT' }, options)).toHaveLength(0);

			expect(validatePayload(mockFilter, { value: 'match-exact' }, options)).toHaveLength(1);
			expect(validatePayload(mockFilter, { value: 'mismatch' }, options)).toHaveLength(1);
		});

		test('array values', () => {
			expect(validatePayload(mockFilter, { value: [123, 'MATCH-EXACT'] }, options)).toHaveLength(0);

			expect(validatePayload(mockFilter, { value: [123, 'match-exact'] }, options)).toHaveLength(1);
			expect(validatePayload(mockFilter, { value: [] }, options)).toHaveLength(1);
			expect(validatePayload(mockFilter, { value: ['mismatch'] }, options)).toHaveLength(1);
		});

		test('other values', () => {
			expect(validatePayload(mockFilter, { value: null }, options)).toHaveLength(1);
			expect(validatePayload(mockFilter, { value: undefined }, options)).toHaveLength(1);
			expect(validatePayload(mockFilter, { value: 123 }, options)).toHaveLength(1);
			expect(validatePayload(mockFilter, { value: {} }, options)).toHaveLength(1);
		});
	});

	describe('validates operator: _icontains', () => {
		const mockFilter = {
			_and: [
				{
					value: {
						_icontains: 'match-insensitive',
					},
				},
			],
		};

		const options = { requireAll: true };

		test('string values', () => {
			expect(validatePayload(mockFilter, { value: 'MATCH-insensitive' }, options)).toHaveLength(0);
			expect(validatePayload(mockFilter, { value: 'match-insensitive' }, options)).toHaveLength(0);
			expect(validatePayload(mockFilter, { value: 'substring-match-insensitive' }, options)).toHaveLength(0);

			expect(validatePayload(mockFilter, { value: 'mismatch' }, options)).toHaveLength(1);
		});

		test('array values', () => {
			expect(validatePayload(mockFilter, { value: [123, 'match-insensitive'] }, options)).toHaveLength(0);
			expect(validatePayload(mockFilter, { value: [123, 'MATCH-insensitive'] }, options)).toHaveLength(0);
			expect(validatePayload(mockFilter, { value: [123, 'substring-MATCH-insensitive'] }, options)).toHaveLength(0);

			expect(validatePayload(mockFilter, { value: [] }, options)).toHaveLength(1);
			expect(validatePayload(mockFilter, { value: ['mismatch'] }, options)).toHaveLength(1);
		});

		test('other values', () => {
			expect(validatePayload(mockFilter, { value: null }, options)).toHaveLength(1);
			expect(validatePayload(mockFilter, { value: undefined }, options)).toHaveLength(1);
			expect(validatePayload(mockFilter, { value: 123 }, options)).toHaveLength(1);
			expect(validatePayload(mockFilter, { value: {} }, options)).toHaveLength(1);
		});
	});

	describe('validates operator: _ncontains', () => {
		const mockFilter = {
			_and: [
				{
					value: {
						_ncontains: 'match',
					},
				},
			],
		};

		const options = { requireAll: true };

		test('string values', () => {
			expect(validatePayload(mockFilter, { value: 'foo' }, options)).toHaveLength(0);
			expect(validatePayload(mockFilter, { value: 'MATCH' }, options)).toHaveLength(0);

			expect(validatePayload(mockFilter, { value: 'match' }, options)).toHaveLength(1);
			expect(validatePayload(mockFilter, { value: 'substring-match' }, options)).toHaveLength(1);
		});

		test('array values', () => {
			expect(validatePayload(mockFilter, { value: [] }, options)).toHaveLength(0);
			expect(validatePayload(mockFilter, { value: ['foo'] }, options)).toHaveLength(0);
			expect(validatePayload(mockFilter, { value: ['MATCH'] }, options)).toHaveLength(0);

			expect(validatePayload(mockFilter, { value: ['foo', 'match'] }, options)).toHaveLength(1);
			expect(validatePayload(mockFilter, { value: ['substring-match'] }, options)).toHaveLength(1);
		});

		test('other values', () => {
			expect(validatePayload(mockFilter, { value: null }, options)).toHaveLength(1);
			expect(validatePayload(mockFilter, { value: undefined }, options)).toHaveLength(1);
			expect(validatePayload(mockFilter, { value: 123 }, options)).toHaveLength(1);
			expect(validatePayload(mockFilter, { value: {} }, options)).toHaveLength(1);
		});
	});

	describe('validates operator: _regex', () => {
		const mockFilter = {
			_and: [
				{
					value: {
						_regex: '^$|foo',
					},
				},
			],
		};

		const options = { requireAll: true };

		test('string value', () => {
			expect(validatePayload(mockFilter, { value: 'foo' }, options)).toHaveLength(0);

			expect(validatePayload(mockFilter, { value: 'bar' }, options)).toHaveLength(1);
		});

		test('other values', () => {
			expect(validatePayload(mockFilter, { value: '' }, options)).toHaveLength(0);

			expect(validatePayload(mockFilter, { value: undefined }, options)).toHaveLength(1);
			expect(validatePayload(mockFilter, { value: null }, options)).toHaveLength(1);
		});
	});
});
