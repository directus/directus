import { describe, expect, test } from 'vitest';
import { isFieldAllowed } from './is-field-allowed.js';

describe('isFieldAllowed', () => {
	describe('Array', () => {
		test('returns true if field is in array', () => {
			expect(isFieldAllowed(['id', 'title'], 'id')).toBe(true);
		});

		test('returns true if wildcard is in array', () => {
			expect(isFieldAllowed(['*'], 'id')).toBe(true);
		});

		test('returns true if both field and wildcard are in array', () => {
			expect(isFieldAllowed(['*', 'id'], 'id')).toBe(true);
		});

		test('returns false if field not in array and no wildcard', () => {
			expect(isFieldAllowed(['title'], 'id')).toBe(false);
		});

		test('returns false if array is empty', () => {
			expect(isFieldAllowed([], 'id')).toBe(false);
		});
	});

	describe('Set', () => {
		test('returns true if field is in set', () => {
			expect(isFieldAllowed(new Set(['id', 'title']), 'id')).toBe(true);
		});

		test('returns true if wildcard is in set', () => {
			expect(isFieldAllowed(new Set(['*']), 'id')).toBe(true);
		});

		test('returns true if both field and wildcard are in set', () => {
			expect(isFieldAllowed(new Set(['*', 'id']), 'id')).toBe(true);
		});

		test('returns false if field not in set and no wildcard', () => {
			expect(isFieldAllowed(new Set(['title']), 'id')).toBe(false);
		});

		test('returns false if set is empty', () => {
			expect(isFieldAllowed(new Set([]), 'id')).toBe(false);
		});
	});
});
