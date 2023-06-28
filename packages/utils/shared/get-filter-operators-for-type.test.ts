import { describe, expect, it } from 'vitest';
import { getFilterOperatorsForType } from './get-filter-operators-for-type.js';

describe('', () => {
	it('returns the filter operators for alias', () => {
		expect(getFilterOperatorsForType('alias')).toStrictEqual([
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
		expect(getFilterOperatorsForType('boolean')).toStrictEqual(['eq', 'neq', 'null', 'nnull']);
	});

	it('returns the filter operators for dateTime', () => {
		expect(getFilterOperatorsForType('dateTime')).toStrictEqual([
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

	it('returns the filter operators for float', () => {
		expect(getFilterOperatorsForType('float')).toStrictEqual([
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
		expect(getFilterOperatorsForType('integer')).toStrictEqual([
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
		expect(getFilterOperatorsForType('json')).toStrictEqual(['null', 'nnull']);
	});

	it('returns the filter operators for binary', () => {
		expect(getFilterOperatorsForType('binary')).toStrictEqual([
			'contains',
			'ncontains',
			'icontains',
			'starts_with',
			'nstarts_with',
			'istarts_with',
			'nistarts_with',
			'ends_with',
			'nends_with',
			'iends_with',
			'niends_with',
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
		expect(getFilterOperatorsForType('geometry')).toStrictEqual([
			'eq',
			'neq',
			'null',
			'nnull',
			'intersects',
			'nintersects',
			'intersects_bbox',
			'nintersects_bbox',
		]);
	});

	it('includes validation only types', () => {
		expect(getFilterOperatorsForType('alias', { includeValidation: true })).toStrictEqual([
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
			'regex',
		]);
	});
});
