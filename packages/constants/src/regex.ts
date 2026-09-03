export const REGEX_BETWEEN_PARENS: RegExp = /\(([^()]+)\)/;
export const REGEX_DB_SAFE_IDENTIFIER: RegExp = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

/**
 * A duration adjustment, using the same syntax as Vercel's `ms`. Captures the amount and the
 * optional unit.
 *
 * The numeric group is written so there is exactly one way to match any given input. An integer
 * part that is both optional and repeated (`(?:\d+)?\.?\d+`) gives the engine a split point per
 * digit, making a failed match quadratic in the input length.
 */
export const REGEX_DATE_ADJUSTMENT: RegExp =
	/^(-?(?:\d+(?:\.\d+)?|\.\d+)) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|months?|mth|mo|years?|yrs?|y)?$/i;
