import { describe, expect, it } from 'vitest';
import { isDomainAllowed } from './domain.js';

describe('isDomainAllowed', () => {
	it('exact match', () => {
		expect(isDomainAllowed('cursor.com', ['cursor.com'])).toBe(true);
	});

	it('exact match is case-insensitive', () => {
		expect(isDomainAllowed('Cursor.COM', ['cursor.com'])).toBe(true);
	});

	it('wildcard matches subdomains', () => {
		expect(isDomainAllowed('tools.anthropic.com', ['*.anthropic.com'])).toBe(true);
		expect(isDomainAllowed('deep.tools.anthropic.com', ['*.anthropic.com'])).toBe(true);
	});

	it('wildcard does NOT match base domain', () => {
		expect(isDomainAllowed('anthropic.com', ['*.anthropic.com'])).toBe(false);
	});

	it('no match returns false', () => {
		expect(isDomainAllowed('evil.com', ['cursor.com', '*.anthropic.com'])).toBe(false);
	});

	it('empty patterns returns false', () => {
		expect(isDomainAllowed('cursor.com', [])).toBe(false);
	});

	it('trims whitespace in patterns', () => {
		expect(isDomainAllowed('cursor.com', [' cursor.com '])).toBe(true);
	});
});
