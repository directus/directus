import { afterEach, beforeEach, describe, expect, test, vi } from 'vite-plus/test';
import { parseNow } from './parse-now.js';

const INVALID_INPUTS = [
	{ input: '$CURRENT_USER' },
	{ input: '$CURRENT_ROLE' },
	{ input: 'some string' },
	{ input: '' },
	{ input: '$now' },
	{ input: '$Now' },
];

const ADJUSTMENT_CASES = [
	{ input: '$NOW(-7 days)', expected: '2024-06-08T12:30:00.000Z' },
	{ input: '$NOW(+3 days)', expected: '2024-06-18T12:30:00.000Z' },
	{ input: '$NOW(-2 hours)', expected: '2024-06-15T10:30:00.000Z' },
	{ input: '$NOW(+5 h)', expected: '2024-06-15T17:30:00.000Z' },
	{ input: '$NOW(-30 minutes)', expected: '2024-06-15T12:00:00.000Z' },
	{ input: '$NOW(-1 month)', expected: '2024-05-15T12:30:00.000Z' },
	{ input: '$NOW(+1 mo)', expected: '2024-07-15T12:30:00.000Z' },
	{ input: '$NOW(-1 year)', expected: '2023-06-15T12:30:00.000Z' },
	{ input: '$NOW(-2 weeks)', expected: '2024-06-01T12:30:00.000Z' },
	{ input: '$NOW(-10 secs)', expected: '2024-06-15T12:29:50.000Z' },
	{ input: '$NOW(-500 ms)', expected: '2024-06-15T12:29:59.500Z' },
];

const FALLBACK_CASES = [{ input: '$NOW(garbage)' }, { input: '$NOW()' }];

const VALID_VARIANTS = [
	{ input: '$NOW' },
	{ input: '$NOW()' },
	{ input: '$NOW(-1 d)' },
	{ input: '$NOW(+1 d)' },
	{ input: '$NOW(invalid)' },
];

describe('parseNow', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2024-06-15T12:30:00.000Z'));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe('invalid input', () => {
		test.each(INVALID_INPUTS)('throws for "$input"', ({ input }) => {
			expect(() => parseNow(input)).toThrow(Error);
		});
	});

	describe('base $NOW', () => {
		test('returns current date', () => {
			expect(parseNow('$NOW')).toStrictEqual(new Date('2024-06-15T12:30:00.000Z'));
		});
	});

	describe('$NOW with adjustments', () => {
		test.each(ADJUSTMENT_CASES)('$input → $expected', ({ input, expected }) => {
			expect(parseNow(input)).toStrictEqual(new Date(expected));
		});
	});

	describe('fallback', () => {
		test.each(FALLBACK_CASES)('returns current date for "$input"', ({ input }) => {
			expect(parseNow(input)).toStrictEqual(new Date('2024-06-15T12:30:00.000Z'));
		});

		test.each(VALID_VARIANTS)('returns a Date instance for "$input"', ({ input }) => {
			expect(parseNow(input)).toBeInstanceOf(Date);
		});
	});
});
