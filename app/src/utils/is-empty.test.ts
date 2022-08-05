import { describe, it, expect } from 'vitest';

import { isEmpty, notEmpty } from '@/utils/is-empty';

describe('isEmpty', () => {
	it('Returns true for null', () => {
		expect(isEmpty(null)).toBe(true);
	});

	it('Returns true for undefined', () => {
		expect(isEmpty(undefined)).toBe(true);
	});

	it('Returns false for strings/numbers/etc', () => {
		expect(isEmpty('')).toBe(false);
		expect(isEmpty('hello')).toBe(false);
		expect(isEmpty(123)).toBe(false);
		expect(isEmpty(0)).toBe(false);
		expect(isEmpty([])).toBe(false);
		expect(isEmpty({})).toBe(false);
	});
});

describe('notEmpty', () => {
	it('Returns false for null', () => {
		expect(notEmpty(null)).toBe(false);
	});

	it('Returns false for undefined', () => {
		expect(notEmpty(undefined)).toBe(false);
	});

	it('Returns true for strings/numbers/etc', () => {
		expect(notEmpty('')).toBe(true);
		expect(notEmpty('hello')).toBe(true);
		expect(notEmpty(123)).toBe(true);
		expect(notEmpty(0)).toBe(true);
		expect(notEmpty([])).toBe(true);
		expect(notEmpty({})).toBe(true);
	});
});
