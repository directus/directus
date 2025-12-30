import { getRedactedString } from './get-redacted-string.js';
import { describe, expect, it } from 'vitest';

describe('getRedactedString', () => {
	it('redacts without a key', () => {
		expect(getRedactedString()).toBe('--redacted--');
	});

	it('redacts with a key', () => {
		expect(getRedactedString('A_KEY')).toBe('--redacted:A_KEY--');
	});
});
