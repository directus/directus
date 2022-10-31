import { describe, expect, it } from 'vitest';
import { isValidFilterOperator } from './is-valid-filter-operator';

describe('is valid filter operator check', () => {
	it('not a filter operator', () => {
		expect(isValidFilterOperator('_id')).toEqual(false);
		expect(isValidFilterOperator('_test_123_')).toEqual(false);
	});

	it('valid filter operators', () => {
		expect(isValidFilterOperator('_eq')).toBe(true);
		expect(isValidFilterOperator('_neq')).toBe(true);
		expect(isValidFilterOperator('_lt')).toBe(true);
		expect(isValidFilterOperator('_lte')).toBe(true);
		expect(isValidFilterOperator('_gt')).toBe(true);
		expect(isValidFilterOperator('_gte')).toBe(true);
		expect(isValidFilterOperator('_in')).toBe(true);
		expect(isValidFilterOperator('_nin')).toBe(true);
		expect(isValidFilterOperator('_null')).toBe(true);
		expect(isValidFilterOperator('_nnull')).toBe(true);
		expect(isValidFilterOperator('_contains')).toBe(true);
		expect(isValidFilterOperator('_ncontains')).toBe(true);
		expect(isValidFilterOperator('_icontains')).toBe(true);
		expect(isValidFilterOperator('_between')).toBe(true);
		expect(isValidFilterOperator('_nbetween')).toBe(true);
		expect(isValidFilterOperator('_empty')).toBe(true);
		expect(isValidFilterOperator('_nempty')).toBe(true);
		expect(isValidFilterOperator('_intersects')).toBe(true);
		expect(isValidFilterOperator('_nintersects')).toBe(true);
		expect(isValidFilterOperator('_intersects_bbox')).toBe(true);
		expect(isValidFilterOperator('_nintersects_bbox')).toBe(true);
		expect(isValidFilterOperator('_starts_with')).toBe(true);
		expect(isValidFilterOperator('_nstarts_with')).toBe(true);
		expect(isValidFilterOperator('_ends_with')).toBe(true);
		expect(isValidFilterOperator('_nends_with')).toBe(true);
		expect(isValidFilterOperator('_regex')).toBe(true);
		expect(isValidFilterOperator('_some')).toBe(true);
		expect(isValidFilterOperator('_none')).toBe(true);
	});
});
