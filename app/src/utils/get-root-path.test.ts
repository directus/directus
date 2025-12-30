import { extract, getPublicURL, getRootPath } from '@/utils/get-root-path';
import { describe, expect, it } from 'vitest';


Object.defineProperty(window, 'location', {
	value: { href: '', pathname: '' },
	writable: true,
});

describe('extract', () => {
	it('Returns the part of the string leading up to /admin', () => {
		expect(extract('/path/to/admin/something')).toBe('/path/to/');
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
