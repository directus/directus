export const REGEX_BETWEEN_PARENS: RegExp = /\(([^()]+)\)/;
export const REGEX_DB_SAFE_IDENTIFIER: RegExp = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

/**
 * A duration adjustment using the same syntax as Vercel's `ms`, capturing the amount and optional
 * unit. The numeric group has exactly one way to match any input; a split point per digit would
 * make a failed match quadratic in the input length.
 */
export const REGEX_DATE_ADJUSTMENT: RegExp =
	/^(-?(?:\d+(?:\.\d+)?|\.\d+)) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|months?|mth|mo|years?|yrs?|y)?$/i;
