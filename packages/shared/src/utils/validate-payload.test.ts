import { describe, expect, it } from 'vitest';
import { Filter } from '../../src/types/filter';
import { validatePayload } from './validate-payload';

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
			})
		).toHaveLength(4);

		expect(
			validatePayload(mockFilter, {
				a: 0,
				b: 1,
			})
		).toHaveLength(3);

		expect(
			validatePayload(mockFilter, {
				a: 1,
				b: 2,
			})
		).toHaveLength(2);

		expect(
			validatePayload(mockFilter, {
				a: 1,
				b: 1,
			})
		).toHaveLength(0);

		expect(
			validatePayload(mockFilter, {
				a: 2,
				b: 2,
			})
		).toHaveLength(0);
	});
});
