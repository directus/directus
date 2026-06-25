import { random } from 'lodash-es';

const HOURS_IN_SECONDS = 3600;

const ALLOWED_HOURS = new Set([1, 2, 3, 4, 6, 8, 12]);

/**
 * Convert a duration in seconds into a cron expression
 *
 * - Honored intervals (hours): 1, 2, 3, 4, 6, 8, 12.
 * - Random hour offset within [0, hours) spreads load across phase groups.
 * - Any duration outside interval falls back to daily.
 *
 *   3600 (1h)   → fires every hour at random minute and second
 *   7200 (2h)   → fires every 2h, phase offset 0 or 1
 *   25200 (7h)  → daily fallback
 */
export function durationToCron(duration: number): string {
	const second = random(0, 59);
	const minute = random(0, 59);

	if (duration > 0 && duration % HOURS_IN_SECONDS === 0) {
		const hours = duration / HOURS_IN_SECONDS;

		if (ALLOWED_HOURS.has(hours)) {
			// hours=1 has no phase offset so default to `*/1`
			const offset = hours === 1 ? '*' : random(0, hours - 1);
			return `${second} ${minute} ${offset}/${hours} * * *`;
		}
	}

	const hour = random(0, 23);
	return `${second} ${minute} ${hour} * * *`;
}
