import { REGEX_BETWEEN_PARENS } from '@directus/constants';
import { adjustDate } from './adjust-date.js';

/**
 * Resolve a `$NOW` dynamic variable (with optional adjustment) to a `Date`.
 *
 * Examples:
 * - `"$NOW"` → current date/time
 * - `"$NOW(-7 days)"` → 7 days ago
 * - `"$NOW(+1 month)"` → 1 month from now
 *
 * Throws if the value is not a valid `$NOW` variable.
 */
export function parseNow(value: string): Date {
	if (value.startsWith('$NOW') === false) {
		throw new Error(`"${value}" is not a valid $NOW format`);
	}

	if (value.includes('(') && value.includes(')')) {
		const adjustment = value.match(REGEX_BETWEEN_PARENS)?.[1];

		if (adjustment) {
			return adjustDate(new Date(), adjustment) ?? new Date();
		}
	}

	return new Date();
}
