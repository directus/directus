import { describe, expect, it } from 'vitest';
import { adjustDate } from './adjust-date.js';

describe('Adjust a given date by a given change in duration.', () => {
	const date = new Date('2021-09-20T21:06:51.517Z');

	it('returns undefined when the adjustment isnt in a supported format', () => {
		expect(adjustDate(date, '-ms1')).toBe(undefined);
	});

	it('subtracts a year from the date', () => {
		const adjustedDate = new Date('2020-09-20T21:06:51.517Z');
		expect(adjustDate(date, '-1.0y')).toStrictEqual(adjustedDate);
	});

	it('subtracts a month from the date', () => {
		const adjustedDate = new Date('2021-08-20T21:06:51.517Z');
		expect(adjustDate(date, '-1.0mo')).toStrictEqual(adjustedDate);
	});

	it('subtracts a week from the date', () => {
		const adjustedDate = new Date('2021-09-13T21:06:51.517Z');
		expect(adjustDate(date, '-1.0weeks')).toStrictEqual(adjustedDate);
	});

	it('subtracts a day from the date', () => {
		const adjustedDate = new Date('2021-09-19T21:06:51.517Z');
		expect(adjustDate(date, '-1.0')).toStrictEqual(adjustedDate);
	});

	it('subtracts an hour from the date', () => {
		const adjustedDate = new Date('2021-09-20T20:06:51.517Z');
		expect(adjustDate(date, '-1.0h')).toStrictEqual(adjustedDate);
	});

	it('subtracts a minute from the date', () => {
		const adjustedDate = new Date('2021-09-20T21:05:51.517Z');
		expect(adjustDate(date, '-1.0minutes')).toStrictEqual(adjustedDate);
	});

	it('subtracts a second from the date', () => {
		const adjustedDate = new Date('2021-09-20T21:06:50.517Z');
		expect(adjustDate(date, '-1.0secs')).toStrictEqual(adjustedDate);
	});

	it('subtracts a millisecond from the date', () => {
		const adjustedDate = new Date('2021-09-20T21:06:51.516Z');
		expect(adjustDate(date, '-1.0ms')).toStrictEqual(adjustedDate);
	});

	it('adds a whole number of days when no unit is given', () => {
		expect(adjustDate(date, '2')).toStrictEqual(new Date('2021-09-22T21:06:51.517Z'));
	});

	it('accepts a fraction with no integer part', () => {
		expect(adjustDate(date, '.5h')).toStrictEqual(new Date('2021-09-20T21:36:51.517Z'));
	});

	it('accepts a fraction with an integer part', () => {
		expect(adjustDate(date, '1.5h')).toStrictEqual(new Date('2021-09-20T22:36:51.517Z'));
	});

	it('accepts a long but valid adjustment', () => {
		// Exercises the separator branch at a length far past anything realistic
		expect(adjustDate(date, '1' + ' '.repeat(40) + 'days')).toStrictEqual(new Date('2021-09-21T21:06:51.517Z'));
	});

	// The numeric group is now written so there is exactly one way to match any input. These pin
	// which forms it accepts, so the restructuring cannot quietly widen or narrow it.
	it.each(['1', '10', '1.5', '.5', '0.5', '-1', '-1.5', '-.5'])('accepts the numeric form %s', (adjustment) => {
		expect(adjustDate(date, adjustment)).toBeInstanceOf(Date);
	});

	it.each(['', '.', '..', '1.', '1..2', '1.2.3', '1,5', '1e5', 'days', '-', '- 1'])(
		'rejects the numeric form %s',
		(adjustment) => {
			expect(adjustDate(date, adjustment)).toBe(undefined);
		},
	);

	// A long run of digits followed by a character that defeats the anchor is the shape that takes
	// time quadratic in the input length. The length guard rejects it before the regex runs, so
	// this covers the guard only — `REGEX_DATE_ADJUSTMENT` is never reached at this length.
	// Asserting completion rather than elapsed time keeps this stable in CI.
	it.each([1_000, 100_000])('rejects %i digits followed by an invalid suffix without stalling', (digits) => {
		expect(adjustDate(date, '1'.repeat(digits) + '!')).toBe(undefined);
	});

	it('rejects input longer than any valid adjustment', () => {
		expect(adjustDate(date, '1'.repeat(65))).toBe(undefined);
	});

	it('accepts input at the length limit', () => {
		expect(adjustDate(date, '1' + ' '.repeat(59) + 'days')).toBeInstanceOf(Date);
	});
});
