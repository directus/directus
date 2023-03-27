import { describe, expect, it } from 'vitest';
import { functions } from './functions.js';

describe('Data Functions', () => {
	describe('year', () => {
		it('Returns the year from a given ISO string', () => {
			const input = '2022-03-30T13:44:49.166Z';
			const output = functions.year(input);
			expect(output).toBe(2022);
		});
	});

	describe('month', () => {
		it('Returns the month from a given ISO string', () => {
			const input = '2022-03-30T13:44:49.166Z';
			const output = functions.month(input);
			expect(output).toBe(3);
		});
	});

	describe('week', () => {
		it('Returns the week from a given ISO string', () => {
			const input = '2022-03-30T13:44:49.166Z';
			const output = functions.week(input);
			expect(output).toBe(14);
		});
	});

	describe('day', () => {
		it('Returns the day from a given ISO string', () => {
			const input = '2022-03-30T13:44:49.166Z';
			const output = functions.day(input);
			expect(output).toBe(30);
		});
	});

	describe('weekday', () => {
		it('Returns the weekday from a given ISO string', () => {
			const input = '2022-03-30T13:44:49.166Z';
			const output = functions.weekday(input);
			expect(output).toBe(3);
		});
	});

	describe('hour', () => {
		it('Returns the hour from a given ISO string', () => {
			const input = '2022-03-30T13:44:49.166+0200';
			const output = functions.hour(input);
			expect(output).toBe(11);
		});
	});

	describe('minute', () => {
		it('Returns the minute from a given ISO string', () => {
			const input = '2022-03-30T13:44:49.166Z';
			const output = functions.minute(input);
			expect(output).toBe(44);
		});
	});

	describe('second', () => {
		it('Returns the second from a given ISO string', () => {
			const input = '2022-03-30T13:44:49.166Z';
			const output = functions.second(input);
			expect(output).toBe(49);
		});
	});

	describe('count', () => {
		it('Returns the length of a given array', () => {
			const input = ['a', 'b', 'c'];
			const output = functions.count(input);
			expect(output).toBe(3);
		});
	});
});
