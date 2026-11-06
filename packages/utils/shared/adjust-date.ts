import {
	addDays,
	addHours,
	addMilliseconds,
	addMinutes,
	addMonths,
	addSeconds,
	addYears,
	subHours,
	subMilliseconds,
	subMinutes,
	subMonths,
	subSeconds,
	subYears,
} from 'date-fns';
import { clone } from 'lodash-es';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * `addDays` drops the fractional part of the amount (and rounds a negative fraction the wrong way), so the whole
 * days are added as calendar days and the fraction is added as a fixed duration, like the hour and minute units.
 */
function addFractionalDays(date: Date, days: number): Date {
	const wholeDays = Math.trunc(days);

	return addMilliseconds(addDays(date, wholeDays), (days - wholeDays) * MS_PER_DAY);
}

/**
 * Adjust a given date by a given change in duration. The adjustment value uses the exact same syntax
 * and logic as Vercel's `ms`.
 *
 * The conversion is lifted straight from `ms`.
 */
export function adjustDate(date: Date, adjustment: string): Date | undefined {
	date = clone(date);

	const subtract = adjustment.startsWith('-');

	if (subtract || adjustment.startsWith('+')) {
		adjustment = adjustment.substring(1);
	}

	const match =
		/^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|months?|mth|mo|years?|yrs?|y)?$/i.exec(
			adjustment,
		);

	if (!match || !match[1]) {
		return;
	}

	const amount = parseFloat(match[1]);
	const type = (match[2] ?? 'days').toLowerCase();

	switch (type) {
		case 'years':
		case 'year':
		case 'yrs':
		case 'yr':
		case 'y':
			return subtract ? subYears(date, amount) : addYears(date, amount);
		case 'months':
		case 'month':
		case 'mth':
		case 'mo':
			return subtract ? subMonths(date, amount) : addMonths(date, amount);
		case 'weeks':
		case 'week':
		case 'w':
			return addFractionalDays(date, (subtract ? -amount : amount) * 7);
		case 'days':
		case 'day':
		case 'd':
			return addFractionalDays(date, subtract ? -amount : amount);
		case 'hours':
		case 'hour':
		case 'hrs':
		case 'hr':
		case 'h':
			return subtract ? subHours(date, amount) : addHours(date, amount);
		case 'minutes':
		case 'minute':
		case 'mins':
		case 'min':
		case 'm':
			return subtract ? subMinutes(date, amount) : addMinutes(date, amount);
		case 'seconds':
		case 'second':
		case 'secs':
		case 'sec':
		case 's':
			return subtract ? subSeconds(date, amount) : addSeconds(date, amount);
		case 'milliseconds':
		case 'millisecond':
		case 'msecs':
		case 'msec':
		case 'ms':
			return subtract ? subMilliseconds(date, amount) : addMilliseconds(date, amount);
		default:
			return undefined;
	}
}
