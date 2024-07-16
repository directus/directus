import { expect, test } from 'vitest';
import { getAllowedLogLevels } from './get-allowed-log-levels.js';

test('should return correct log levels for "info"', () => {
	const result = getAllowedLogLevels('info');
	expect(result).toEqual(['info', 'warn', 'error', 'fatal']);
});

test('should return correct log levels for "warn"', () => {
	const result = getAllowedLogLevels('warn');
	expect(result).toEqual(['warn', 'error', 'fatal']);
});

test('should return an empty array for "fatal"', () => {
	const result = getAllowedLogLevels('fatal');
	expect(result).toEqual(['fatal']);
});

test('should error when an invalid log level is provided', () => {
	const invalidLogLevel = 'invalid-level';
	expect(() => getAllowedLogLevels(invalidLogLevel as any)).toThrowError(`Invalid log level: ${invalidLogLevel}`);
});
