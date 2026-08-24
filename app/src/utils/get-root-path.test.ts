import { describe, expect, it } from 'vitest';
import { extractPath, extractRoot, getPublicURL, getRootPath } from '@/utils/get-root-path';

Object.defineProperty(window, 'location', {
	value: { href: '', pathname: '' },
	writable: true,
});

describe('extractRoot', () => {
	it('Returns the part of the string leading up to /admin', () => {
		expect(extractRoot('/path/to/admin/something')).toBe('/path/to/');
	});

	it('Returns root for full URL', () => {
		expect(extractRoot('https://example.com/path/to/admin/something')).toBe('https://example.com/path/to/');
	});
});

describe('extractPath', () => {
	it('Returns the part of the string from /admin onwards', () => {
		expect(extractPath('/path/to/admin/something')).toBe('/something');
	});

	it('Extracts path from full URL', () => {
		expect(extractPath('https://example.com/admin/content')).toBe('/content');
	});

	it('Preserves query string and hash', () => {
		expect(extractPath('https://example.com/admin/content?foo=bar#section')).toBe('/content?foo=bar#section');
	});

	it('Returns /admin when at admin root', () => {
		expect(extractPath('/admin')).toBe('/');
	});

	it('Handles nested admin paths', () => {
		expect(extractPath('https://example.com/subpath/admin/settings/project')).toBe('/settings/project');
	});
});

describe('getRootPath', () => {
	it('Extracts the root path, using the current window pathname as the input path', () => {
		window.location.pathname = '/path/to/admin/something';
		expect(getRootPath()).toBe('/path/to/');
	});
});

describe('getPublicURL', () => {
	it('Extracts the root URL, using the current window href as the input path', () => {
		window.location.href = 'https://example.com/path/to/admin/something';
		expect(getPublicURL()).toBe('https://example.com/path/to/');
	});
});
