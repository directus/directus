import { describe, expect, test } from 'vitest';
import { queryFlag } from './query-flag.js';

describe('queryFlag', () => {
	test('treats a bare flag (empty string) as true', () => {
		expect(queryFlag('')).toBe(true);
	});

	test('parses truthy string values', () => {
		expect(queryFlag('true')).toBe(true);
		expect(queryFlag('1')).toBe(true);
	});

	test('parses falsy string values', () => {
		expect(queryFlag('false')).toBe(false);
		expect(queryFlag('0')).toBe(false);
	});

	test('returns false for an absent value', () => {
		expect(queryFlag(undefined)).toBe(false);
	});
});
