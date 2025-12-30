import { adjustDate } from './adjust-date.js';
import { describe, expect, it } from 'vitest';

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
});
