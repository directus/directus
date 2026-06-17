import { describe, expect, test } from 'vitest';
import { validateCron } from '../../utils/schedule.js';
import { durationToCron } from './duration-to-cron.js';

const ALLOWED_INTERVAL = /^([0-5]?\d) ([0-5]?\d) (\*|\d{1,2})\/(1|2|3|4|6|8|12) \* \* \*$/;
const DAILY_FALLBACK = /^([0-5]?\d) ([0-5]?\d) ([01]?\d|2[0-3]) \* \* \*$/;

const ALLOWED_INTERVAL_DURATIONS = [
	[3600, 1],
	[7200, 2],
	[10800, 3],
	[14400, 4],
	[21600, 6],
	[28800, 8],
	[43200, 12],
];

const DAILY_FALLBACK_DURATIONS = [
	[0, 'zero'],
	[-3600, 'negative'],
	[1800, '30m — sub-hour'],
	[3601, '1h+1s — off the hour grid'],
	[25200, '7h — gap in allowlist'],
	[86400, '24h — common assumption that daily should work'],
];

describe('durationToCron', () => {
	test.each(ALLOWED_INTERVAL_DURATIONS)('%i seconds → OFFSET/%i hour cadence', (duration, hours) => {
		const cron = durationToCron(duration);
		const match = cron.match(ALLOWED_INTERVAL);

		expect(match, `expected ${cron} to match ${ALLOWED_INTERVAL}`).not.toBeNull();

		const offsetStr = match![3]!;
		const step = Number(match![4]);

		expect(step).toBe(hours);

		if (hours === 1) {
			expect(offsetStr).toBe('*');
		} else {
			const offset = Number(offsetStr);
			expect(offset).toBeGreaterThanOrEqual(0);
			expect(offset).toBeLessThan(step);
		}

		expect(validateCron(cron)).toBe(true);
	});

	test.each(DAILY_FALLBACK_DURATIONS)('%i seconds (%s) → daily fallback', (duration) => {
		const cron = durationToCron(duration as number);

		expect(cron).toMatch(DAILY_FALLBACK);
		expect(cron).not.toMatch(ALLOWED_INTERVAL);
		expect(validateCron(cron)).toBe(true);
	});
});
