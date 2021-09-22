import { filtersToQuery } from '.';
import { Filter } from '../types/filter';

describe('filtersToQuery', () => {
	it('converts an array of filter fields to a filter object ', () => {
		const mockFilters = [{ _and: [{ field: 'field' }], _or: [{ filter: 'field' }] }] as readonly Filter[];
		expect(filtersToQuery(mockFilters)).toStrictEqual({ filter: {} });
	});
});
