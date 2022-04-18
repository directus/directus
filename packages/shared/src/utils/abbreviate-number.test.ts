import { abbreviateNumber } from './abbreviate-number';

describe('when no unit is given', () => {
	it('returns a string representation of the number when under 1000', () => {
		expect(abbreviateNumber(0.78, 2)).toBe('0.78');
	});
	it('returns a string representation of the number rounded to nearest 1000 unit: k', () => {
		expect(abbreviateNumber(7008, 0)).toBe('7K');
	});
	it('returns a string representation of the rounded number when negative', () => {
		expect(abbreviateNumber(-7008, 0)).toBe('-7K');
	});
});

describe('when unit M is given', () => {
	it('returns a string representation of the number rounded to nearest 1000 unit: M', () => {
		expect(abbreviateNumber(7008, 0, ['M'])).toBe('7M');
	});
	it('returns a string representation of the rounded number when negative', () => {
		expect(abbreviateNumber(-7008, 0, ['M'])).toBe('-7M');
	});
});

describe('when multiple units(["M","T"]) are given', () => {
	it('returns a string representation of the number rounded to nearest 1000 unit: M', () => {
		expect(abbreviateNumber(7008, 0, ['M', 'T'])).toBe('7M');
	});
	it('returns a string representation of the rounded number when negative', () => {
		expect(abbreviateNumber(-7008, 0, ['M', 'T'])).toBe('-7M');
	});
});
