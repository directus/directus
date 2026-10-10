import ms, { type StringValue } from 'ms';

/**
 * Parse a human readable duration (eg `15m`) or a plain number of milliseconds into milliseconds.
 * Returns `undefined` for empty or unparsable values
 */
export const toMilliseconds = (value: unknown): number | undefined => {
	if ((typeof value !== 'string' && typeof value !== 'number') || value === '') return undefined;

	const milliseconds = ms(String(value) as StringValue);

	return Number.isNaN(milliseconds) ? undefined : milliseconds;
};
