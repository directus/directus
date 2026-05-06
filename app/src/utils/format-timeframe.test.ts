import { expect, test, vi } from 'vitest';
import { formatTimeframe } from '@/utils/format-timeframe';

vi.mock('@/lang', () => ({
	i18n: { global: { locale: { value: 'en-US' } } },
}));

const DAY = 86400;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

test('formats exact years', () => {
	expect(formatTimeframe(YEAR)).toBe('1 year');
	expect(formatTimeframe(2 * YEAR)).toBe('2 years');
});

test('formats exact months', () => {
	expect(formatTimeframe(MONTH)).toBe('1 month');
	expect(formatTimeframe(6 * MONTH)).toBe('6 months');
});

test('formats exact weeks', () => {
	expect(formatTimeframe(WEEK)).toBe('1 week');
	expect(formatTimeframe(3 * WEEK)).toBe('3 weeks');
});

test('falls back to days for non-round durations', () => {
	expect(formatTimeframe(DAY)).toBe('1 day');
	expect(formatTimeframe(10 * DAY)).toBe('10 days');
});

test('years take priority over months (365 is divisible by both)', () => {
	expect(formatTimeframe(YEAR)).toBe('1 year');
});
