import { getValidationErrors } from './get-validation-errors';
import { Filter } from '../types/filter';

describe('getValidationErrors', () => {
	it('returns an empty array when there are no errors', () => {
		const mockFilter = { _and: [{ field: { _eq: 'field' } }] } as Filter;
		const mockPayload = { field: 'field' };
		expect(getValidationErrors(mockFilter, mockPayload)).toStrictEqual([]);
	});
	it('returns an array of 1 when there errors with an _and operator', () => {
		const mockFilter = { _and: [{ field: { _eq: 'field' } }] } as Filter;
		const mockPayload = { field: 'test' };
		expect(getValidationErrors(mockFilter, mockPayload)).toHaveLength(1);
	});
	it('returns an array of 1 when there errors with an _or operator', () => {
		const mockFilter = { _or: [{ field: { _eq: 'field' } }] } as Filter;
		const mockPayload = { field: 'test' };
		expect(getValidationErrors(mockFilter, mockPayload)).toHaveLength(1);
	});
});
