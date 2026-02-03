import { describe, expect, it } from 'vitest';
import { toBoolean } from './to-boolean.js';

describe('toBoolean', () => {
	it('returns true for string "true"', () => {
		expect(toBoolean('true')).toBe(true);
	});

	it('returns true for boolean true', () => {
		expect(toBoolean(true)).toBe(true);
	});

	it('returns true for string "1"', () => {
		expect(toBoolean('1')).toBe(true);
	});

	it('returns true for number 1', () => {
		expect(toBoolean(1)).toBe(true);
	});

	it('returns false for string "false"', () => {
		expect(toBoolean('false')).toBe(false);
	});

	it('returns false for boolean false', () => {
		expect(toBoolean(false)).toBe(false);
	});

	it('returns false for string "0"', () => {
		expect(toBoolean('0')).toBe(false);
	});

	it('returns false for number 0', () => {
		expect(toBoolean(0)).toBe(false);
	});

	it('returns false for null', () => {
		expect(toBoolean(null)).toBe(false);
	});

	it('returns false for undefined', () => {
		expect(toBoolean(undefined)).toBe(false);
	});

	it('returns false for empty string', () => {
		expect(toBoolean('')).toBe(false);
	});

	it('returns false for random string', () => {
		expect(toBoolean('yes')).toBe(false);
	});

	it('returns false for object', () => {
		expect(toBoolean({})).toBe(false);
	});

	it('returns false for array', () => {
		expect(toBoolean([])).toBe(false);
	});
});
