import { addYears, addWeeks, addMonths, addDays, addHours, addMinutes, addSeconds, addMilliseconds } from 'date-fns';
import { clone } from 'lodash';

/**
 * Adjust a given date by a given change in duration. The adjustment value uses the exact same syntax
 * and logic as Vercel's `ms`.
 *
 * The conversion is lifted straight from `ms`.
 */
export function adjustDate(date: Date, adjustment: string): Date | undefined {
	date = clone(date);

	const match =
		/^((?:-|\+)?\d*?\.?\d+?) *?(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|months?|mth|mo|years?|yrs?|y)?$/i.exec(
			adjustment.trim()
		);

	if (!match || !match[1]) return;

	const amount = parseFloat(match[1]);
	const type = (match[2] ?? 'days').toLowerCase();

	switch (type) {
		case 'years':
		case 'year':
		case 'yrs':
		case 'yr':
		case 'y':
			return addYears(date, amount);
		case 'months':
		case 'month':
		case 'mth':
		case 'mo':
			return addMonths(date, amount);
		case 'weeks':
		case 'week':
		case 'w':
			return addWeeks(date, amount);
		case 'days':
		case 'day':
		case 'd':
			return addDays(date, amount);
		case 'hours':
		case 'hour':
		case 'hrs':
		case 'hr':
		case 'h':
			return addHours(date, amount);
		case 'minutes':
		case 'minute':
		case 'mins':
		case 'min':
		case 'm':
			return addMinutes(date, amount);
		case 'seconds':
		case 'second':
		case 'secs':
		case 'sec':
		case 's':
			return addSeconds(date, amount);
		case 'milliseconds':
		case 'millisecond':
		case 'msecs':
		case 'msec':
		case 'ms':
			return addMilliseconds(date, amount);
		default:
			return undefined;
	}
}
