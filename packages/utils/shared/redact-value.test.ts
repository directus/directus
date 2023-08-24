import { describe, expect, it } from 'vitest';
import { redactValue } from './redact-value.js';

describe('redactValue', () => {
	it('redacts without a key', () => {
		expect(redactValue()).toBe('--redacted--');
	});

	it('redacts with a key', () => {
		expect(redactValue('A_KEY')).toBe('--redacted:A_KEY--');
	});
});
