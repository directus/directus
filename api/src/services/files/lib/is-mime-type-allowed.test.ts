import { describe, expect, test } from 'vitest';
import { isMimeTypeAllowed } from './is-mime-type-allowed.js';

const TEST_CASES: { mimeType: string; patterns: string | string[]; expected: boolean; description: string }[] = [
	{ mimeType: 'image/png', patterns: 'image/png', expected: true, description: 'exact match' },
	{
		mimeType: 'text/html',
		patterns: 'image/png',
		expected: false,
		description: 'type that does not match the pattern',
	},
	{ mimeType: 'text/html', patterns: '*/*', expected: true, description: 'any type against the */* wildcard' },
	{ mimeType: 'image/png', patterns: 'image/*', expected: true, description: 'subtype glob match' },
	{ mimeType: 'text/html', patterns: 'image/*', expected: false, description: 'subtype glob mismatch' },
	{
		mimeType: 'image/png',
		patterns: 'image/jpeg,image/png',
		expected: true,
		description: 'comma-separated list match',
	},
	{
		mimeType: 'text/html',
		patterns: 'image/jpeg,image/png',
		expected: false,
		description: 'comma-separated list mismatch',
	},
	{
		mimeType: 'image/png',
		patterns: ['image/jpeg', 'image/*'],
		expected: true,
		description: 'array of patterns match',
	},
	{
		mimeType: 'text/html',
		patterns: ['image/jpeg', 'image/png'],
		expected: false,
		description: 'array of patterns mismatch',
	},
];

describe('isMimeTypeAllowed', () => {
	test.each(TEST_CASES)('$description', ({ mimeType, patterns, expected }) => {
		expect(isMimeTypeAllowed(mimeType, patterns)).toBe(expected);
	});
});
