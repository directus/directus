import { describe, expect, it } from 'vitest';
import { cliError, isCliError } from './result.js';

describe('isCliError', () => {
	it('accepts a genuine CliError', () => {
		expect(isCliError(cliError('USAGE', 'bad input'))).toBe(true);
	});

	it('rejects foreign thrown values so they cannot poison the --json error payload', () => {
		// A Node SystemError-ish shape: has `code`/`message` keys but wrong types.
		expect(isCliError({ code: 1, message: 2, exitCode: 'x' })).toBe(false);
		// Missing exitCode entirely (e.g. a plain HTTP error object).
		expect(isCliError({ code: 'ECONNRESET', message: 'socket hang up' })).toBe(false);
		expect(isCliError(null)).toBe(false);
		expect(isCliError('nope')).toBe(false);
		// An array carrying the error shape must not pass — arrays are objects.
		expect(isCliError(Object.assign([], { code: 'USAGE', message: 'x', exitCode: 1 }))).toBe(false);
	});
});
