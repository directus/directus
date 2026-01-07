import { describe, expect, it } from 'vitest';
import { abbreviateNumber } from './abbreviate-number.js';

describe('when no unit is given', () => {
	it('when under 1000', () => {
		expect(abbreviateNumber(0.78, 2)).toBe('0.78');
	});

	it('when a number over 1000 is given', () => {
		expect(abbreviateNumber(7008, 0)).toBe('7K');
	});

	it('when negative number is given', () => {
		expect(abbreviateNumber(-7008, 0)).toBe('-7K');
	});
});

describe('when unit M is given', () => {
	it('when under 1000', () => {
		expect(abbreviateNumber(0.78, 2, ['M'])).toBe('0.78');
	});

	it('when over 1000', () => {
		expect(abbreviateNumber(8000, 0, ['M'])).toBe('8M');
	});

	it('when negative', () => {
		expect(abbreviateNumber(-7008, 0, ['M'])).toBe('-7M');
	});
});

describe('when multiple units(["M","T"]) are given', () => {
	it('when under 1000', () => {
		expect(abbreviateNumber(0.78, 2, ['M', 'T'])).toBe('0.78');
	});

	it('when number is over 1000', () => {
		expect(abbreviateNumber(7008, 0, ['M', 'T'])).toBe('7M');
	});

	it('returns a string representation of the rounded number when negative', () => {
		expect(abbreviateNumber(-7008, 0, ['M', 'T'])).toBe('-7M');
	});
});
