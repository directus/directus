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
 * Returns `null` if the value is not a `$NOW` variable.
 */
export function parseNow(value: string): Date | null {
	if (!value.startsWith('$NOW')) return null;

	if (value.includes('(') && value.includes(')')) {
		const adjustment = value.match(REGEX_BETWEEN_PARENS)?.[1];
		if (!adjustment) return new Date();
		// Fall back to current date if the adjustment string is unrecognized
		return adjustDate(new Date(), adjustment) ?? new Date();
	}

	return new Date();
}
