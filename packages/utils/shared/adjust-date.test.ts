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

	describe('fractional days and weeks', () => {
		it.each([
			['0.5d', '2021-09-21T09:06:51.517Z'],
			['-0.5d', '2021-09-20T09:06:51.517Z'],
			['1.5d', '2021-09-22T09:06:51.517Z'],
			['-1.5d', '2021-09-19T09:06:51.517Z'],
			['2.25d', '2021-09-23T03:06:51.517Z'],
			['0.5w', '2021-09-24T09:06:51.517Z'],
			['-0.5w', '2021-09-17T09:06:51.517Z'],
		])('adjusts the date by %s', (adjustment, expected) => {
			expect(adjustDate(date, adjustment)).toStrictEqual(new Date(expected));
		});

		it('keeps adjusting by whole days and weeks as before', () => {
			expect(adjustDate(date, '2d')).toStrictEqual(new Date('2021-09-22T21:06:51.517Z'));
			expect(adjustDate(date, '-1w')).toStrictEqual(new Date('2021-09-13T21:06:51.517Z'));
		});
	});
});
