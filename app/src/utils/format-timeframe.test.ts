import { expect, test, vi } from 'vitest';
import { formatTimeframe } from '@/utils/format-timeframe';

vi.mock('@/lang', () => ({
	i18n: { global: { locale: { value: 'en-US' } } },
}));

const DAY = 86400;

test('formats single day', () => {
	expect(formatTimeframe(DAY)).toBe('1 day');
});

test('formats multiple days', () => {
	expect(formatTimeframe(10 * DAY)).toBe('10 days');
	expect(formatTimeframe(30 * DAY)).toBe('30 days');
	expect(formatTimeframe(365 * DAY)).toBe('365 days');
});
