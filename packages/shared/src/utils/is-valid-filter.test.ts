import { describe, expect, it } from 'vitest';
import { isValidFilter } from './is-valid-filter';

describe('is valid filter check', () => {
	it('not a filter', () => {
		expect(isValidFilter('_id')).toEqual(false);
		expect(isValidFilter('_test_123_')).toEqual(false);
	});

	it('valid filters', () => {
		expect(isValidFilter('_eq')).toBe(true);
		expect(isValidFilter('_neq')).toBe(true);
		expect(isValidFilter('_lt')).toBe(true);
		expect(isValidFilter('_lte')).toBe(true);
		expect(isValidFilter('_gt')).toBe(true);
		expect(isValidFilter('_gte')).toBe(true);
		expect(isValidFilter('_in')).toBe(true);
		expect(isValidFilter('_nin')).toBe(true);
		expect(isValidFilter('_null')).toBe(true);
		expect(isValidFilter('_nnull')).toBe(true);
		expect(isValidFilter('_contains')).toBe(true);
		expect(isValidFilter('_ncontains')).toBe(true);
		expect(isValidFilter('_icontains')).toBe(true);
		expect(isValidFilter('_between')).toBe(true);
		expect(isValidFilter('_nbetween')).toBe(true);
		expect(isValidFilter('_empty')).toBe(true);
		expect(isValidFilter('_nempty')).toBe(true);
		expect(isValidFilter('_intersects')).toBe(true);
		expect(isValidFilter('_nintersects')).toBe(true);
		expect(isValidFilter('_intersects_bbox')).toBe(true);
		expect(isValidFilter('_nintersects_bbox')).toBe(true);
		expect(isValidFilter('_starts_with')).toBe(true);
		expect(isValidFilter('_nstarts_with')).toBe(true);
		expect(isValidFilter('_ends_with')).toBe(true);
		expect(isValidFilter('_nends_with')).toBe(true);
		expect(isValidFilter('_regex')).toBe(true);
		expect(isValidFilter('_some')).toBe(true);
		expect(isValidFilter('_none')).toBe(true);
	});
});
