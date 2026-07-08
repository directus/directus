import { describe, expect, it } from 'vitest';
import { CliError, isCliError } from './error.js';

describe('isCliError', () => {
	it('accepts a genuine CliError', () => {
		expect(isCliError(new CliError('USAGE', 'bad input'))).toBe(true);
	});

	it('rejects anything that is not a CliError instance', () => {
		// A plain object sharing the shape, a foreign Error, and an array carrying
		// the same keys must all fail — otherwise they could leak into the --json
		// error payload or hijack the exit code.
		expect(isCliError({ code: 'USAGE', message: 'x', exitCode: 1 })).toBe(false);
		expect(isCliError(new Error('boom'))).toBe(false);
		expect(isCliError(Object.assign([], { code: 'USAGE', message: 'x', exitCode: 1 }))).toBe(false);
		expect(isCliError(null)).toBe(false);
		expect(isCliError('nope')).toBe(false);
	});

	it('is a real Error subclass so it can be thrown and caught normally', () => {
		const error = new CliError('CONFIG', 'bad config', { exitCode: 2 });
		expect(error).toBeInstanceOf(Error);
		expect(error.exitCode).toBe(2);
	});
});
