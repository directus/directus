import { describe, expect, it } from 'vitest';
import { normalizeUrl } from './normalize-url';

describe('normalizeUrl', () => {
	it('returns normalized URL for valid input', () => {
		expect(normalizeUrl('https://example.com')).toBe('https://example.com');
	});

	it('strips trailing slash', () => {
		expect(normalizeUrl('https://example.com/')).toBe('https://example.com');
	});

	it('preserves path', () => {
		expect(normalizeUrl('https://example.com/path/')).toBe('https://example.com/path');
	});

	it('preserves query params', () => {
		expect(normalizeUrl('https://example.com/?a=1')).toBe('https://example.com/?a=1');
		expect(normalizeUrl('https://example.com/path?a=1')).toBe('https://example.com/path?a=1');
	});

	it('adds trailing slash when having query params only', () => {
		expect(normalizeUrl('https://example.com?a=1')).toBe('https://example.com/?a=1');
	});

	it('returns empty string for relative URL', () => {
		expect(normalizeUrl('/relative/path')).toBe('');
	});

	it('returns empty string for invalid URL', () => {
		expect(normalizeUrl('not-a-url')).toBe('');
	});

	it('returns empty string for empty input', () => {
		expect(normalizeUrl('')).toBe('');
	});
});
