import { expect, test } from 'vitest';
import { getAllowedLogLevels } from './get-allowed-log-levels.js';

test('should return correct log levels for "info"', () => {
	const result = getAllowedLogLevels('info');

	expect(result).toEqual({
		info: 30,
		warn: 40,
		error: 50,
		fatal: 60,
	});
});

test('should return correct log levels for "warn"', () => {
	const result = getAllowedLogLevels('warn');

	expect(result).toEqual({
		warn: 40,
		error: 50,
		fatal: 60,
	});
});

test('should return an empty array for "fatal"', () => {
	const result = getAllowedLogLevels('fatal');

	expect(result).toEqual({
		fatal: 60,
	});
});

test('should error when an invalid log level is provided', () => {
	const invalidLogLevel = 'invalid-level';
	expect(() => getAllowedLogLevels(invalidLogLevel as any)).toThrowError(`Invalid "${invalidLogLevel}" log level`);
});
