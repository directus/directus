import { describe, expect, it } from 'vitest';
import { isValidLogLevel } from './is-valid-log-level';

const tests: [string, boolean][] = [
	['trace', true],
	['debug', true],
	['info', true],
	['warn', true],
	['error', true],
	['fatal', true],
	['invalid', false],
];

describe('is valid log level', () => {
	for (const [value, result] of tests) {
		it(value, () => {
			expect(isValidLogLevel(value)).toBe(result);
		});
	}
});
