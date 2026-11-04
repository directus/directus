import { describe, expect, test } from 'vitest';
import { validateCron } from '../../utils/schedule.js';
import { durationToCron } from './duration-to-cron.js';

const ALLOWED_INTERVAL = /^([0-5]?\d) ([0-5]?\d) (\d{1,2})\/(1|2|3|4|6|8|12) \* \* \*$/;

const DURATIONS = [
	[3600, 1, 'on the grid'],
	[7200, 2, 'on the grid'],
	[10800, 3, 'on the grid'],
	[14400, 4, 'on the grid'],
	[21600, 6, 'on the grid'],
	[28800, 8, 'on the grid'],
	[43200, 12, 'on the grid'],
	[0, 1, 'zero'],
	[-3600, 1, 'negative'],
	[1800, 1, '30m, sub-hour'],
	[3601, 1, '1h+1s, off the hour grid'],
	[25200, 6, '7h, a gap in the allowlist'],
	[86400, 12, '24h, over the longest interval'],
] as const;

describe('durationToCron', () => {
	test.each(DURATIONS)('%i seconds runs every %i hours (%s)', (duration, hours) => {
		const cron = durationToCron(duration, 'seed');
		const match = cron.match(ALLOWED_INTERVAL);

		expect(match, `expected ${cron} to match ${ALLOWED_INTERVAL}`).not.toBeNull();
		expect(Number(match![4])).toBe(hours);

		expect(Number(match![3])).toBeLessThan(hours);

		expect(validateCron(cron)).toBe(true);
	});

	test('the same seed gives the same expression', () => {
		expect(durationToCron(7200, 'project-a')).toBe(durationToCron(7200, 'project-a'));
	});

	test('different seeds spread across the hour', () => {
		const minutes = new Set(Array.from({ length: 20 }, (_, i) => durationToCron(3600, `project-${i}`).split(' ')[1]));

		expect(minutes.size).toBeGreaterThan(1);
	});
});
