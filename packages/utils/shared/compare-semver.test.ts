import { describe, expect, it } from 'vitest';
import { compareSemver } from './compare-semver';

describe('possible input types for comparing semver', () => {
	it('returns 1 if first argument is greater', () => {
		expect(compareSemver('1.0.0', '0.1.1')).toBe(1);
	});

	it('returns -1 if first argument is smaller', () => {
		expect(compareSemver('1.0.0', '1.1.1')).toBe(-1);
	});

	it('returns 0 if arguments are equal', () => {
		expect(compareSemver('1.1.1', '1.1.1')).toBe(0);
	});

	it('returns 1 if second argument is invalid', () => {
		expect(compareSemver('1.1.1', '')).toBe(1);
	});

	it('returns -1 if first argument is invalid', () => {
		expect(compareSemver('', '2.2.2')).toBe(-1);
	});

	it('returns 0 if both arguments are invalid', () => {
		expect(compareSemver('', '')).toBe(0);
	});
});
