import { getFilterOperatorsForType } from './get-filter-operators-for-type';
import { TYPES } from '../constants/fields';

describe('', () => {
	it('returns the filter operators for alias', () => {
		expect(getFilterOperatorsForType(TYPES[0])).toStrictEqual([
			'contains',
			'ncontains',
			'eq',
			'neq',
			'lt',
			'lte',
			'gt',
			'gte',
			'between',
			'nbetween',
			'empty',
			'nempty',
			'null',
			'nnull',
			'in',
			'nin',
		]);
	});

	it('returns the filter operators for boolean', () => {
		expect(getFilterOperatorsForType(TYPES[2])).toStrictEqual(['eq', 'neq', 'null', 'nnull']);
	});

	it('returns the filter operators for dateTime', () => {
		expect(getFilterOperatorsForType(TYPES[4])).toStrictEqual([
			'eq',
			'neq',
			'null',
			'nnull',
			'lt',
			'lte',
			'gt',
			'gte',
			'between',
			'nbetween',
			'null',
			'nnull',
			'in',
			'nin',
		]);
	});

	it('returns the filter operators for float', () => {
		expect(getFilterOperatorsForType(TYPES[6])).toStrictEqual([
			'eq',
			'neq',
			'lt',
			'lte',
			'gt',
			'gte',
			'between',
			'nbetween',
			'null',
			'nnull',
			'in',
			'nin',
		]);
	});

	it('returns the filter operators for integer', () => {
		expect(getFilterOperatorsForType(TYPES[7])).toStrictEqual([
			'eq',
			'neq',
			'lt',
			'lte',
			'gt',
			'gte',
			'between',
			'nbetween',
			'null',
			'nnull',
			'in',
			'nin',
		]);
	});

	it('returns the filter operators for json', () => {
		expect(getFilterOperatorsForType(TYPES[8])).toStrictEqual(['null', 'nnull']);
	});

	it('returns the filter operators for binary', () => {
		expect(getFilterOperatorsForType(TYPES[13])).toStrictEqual([
			'contains',
			'ncontains',
			'starts_with',
			'nstarts_with',
			'ends_with',
			'nends_with',
			'eq',
			'neq',
			'empty',
			'nempty',
			'null',
			'nnull',
			'in',
			'nin',
		]);
	});

	it('returns the filter operators for geometry', () => {
		expect(getFilterOperatorsForType(TYPES[17])).toStrictEqual([
			'null',
			'nnull',
			'intersects',
			'nintersects',
			'intersects_bbox',
			'nintersects_bbox',
		]);
	});
});
