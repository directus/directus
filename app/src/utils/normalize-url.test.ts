import { expect, test } from 'vitest';
import { normalizeUrl } from '@/utils/normalize-url';

test('Returns null for null input', () => {
	expect(normalizeUrl(null)).toBe(null);
});

test('Returns null for empty string', () => {
	expect(normalizeUrl('')).toBe(null);
});

test('Returns normalized absolute URL for relative paths', () => {
	const result = normalizeUrl('/path/to/resource');
	expect(result).toBe(`${window.location.origin}/path/to/resource`);
});

test('Returns same URL for valid absolute URLs', () => {
	const url = 'https://example.com/path';
	expect(normalizeUrl(url)).toBe(url);
});

test('Resolves relative paths against window.location', () => {
	// Paths without protocol are treated as relative
	const result = normalizeUrl('relative/path');
	expect(result).toContain('/relative/path');
});

test('Handles URLs with query params and fragments', () => {
	const url = 'https://example.com/path?query=value#fragment';
	expect(normalizeUrl(url)).toBe(url);
});

test('Handles relative URLs with query params', () => {
	const result = normalizeUrl('/path?query=value');
	expect(result).toBe(`${window.location.origin}/path?query=value`);
});
