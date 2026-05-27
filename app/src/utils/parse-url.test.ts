import { describe, expect, it } from 'vitest';
import { parseUrl } from './parse-url';

describe('parseUrl', () => {
	it('parses valid URL', () => {
		const result = parseUrl('https://example.com/path');
		expect(result).toBeInstanceOf(URL);
		expect(result!.href).toBe('https://example.com/path');
	});

	it('parses URL with query and hash', () => {
		const result = parseUrl('https://example.com/path?a=1#section');
		expect(result!.searchParams.get('a')).toBe('1');
		expect(result!.hash).toBe('#section');
	});

	it('returns null for invalid URL', () => {
		expect(parseUrl('not-a-url')).toBeNull();
	});

	it('returns null for empty string', () => {
		expect(parseUrl('')).toBeNull();
	});

	it('returns null for relative path', () => {
		expect(parseUrl('/relative/path')).toBeNull();
	});
});
