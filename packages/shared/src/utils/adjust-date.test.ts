import { adjustDate } from './adjust-date';

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

	it('calculates `tomorrow` date', () => {
		const adjustedDate = new Date('2021-09-21T00:00:00.000Z');
		expect(adjustDate(date, '+1 day | format: yyyy-MM-dd 00:00')).toStrictEqual(adjustedDate);
	});

	it('calculates `following month on first day` date', () => {
		const adjustedDate = new Date('2021-10-01T00:00:00.000Z');
		expect(adjustDate(date, '+1 month | format: yyyy-MM-01 00:00')).toStrictEqual(adjustedDate);
	});

	it('calculates `on the 15th of following month` date', () => {
		const adjustedDate = new Date('2021-10-15T00:00:00.000Z');
		expect(adjustDate(date, '+1 month | format: yyyy-MM-15 00:00')).toStrictEqual(adjustedDate);
	});

	it('calculates `following year` date', () => {
		const adjustedDate = new Date('2022-01-01T00:00:00.000Z');
		expect(adjustDate(date, '+1 year | format: yyyy-01-01 00:00')).toStrictEqual(adjustedDate);
	});

	it('calculates `july of following year` date', () => {
		const adjustedDate = new Date('2022-07-01T00:00:00.000Z');
		expect(adjustDate(date, '+1 year | format: yyyy-07-01 00:00')).toStrictEqual(adjustedDate);
	});

	it('calculates `july the 21st of following year` date', () => {
		const adjustedDate = new Date('2022-07-21T00:00:00.000Z');
		expect(adjustDate(date, '+1 year | format: yyyy-07-21 00:00')).toStrictEqual(adjustedDate);
	});
});
