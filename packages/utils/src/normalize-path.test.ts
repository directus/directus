import { test, expect } from 'vitest';
import { normalizePath } from './normalize-path.js';

test('Returns single / for given \\', () => {
	expect(normalizePath('\\')).toBe('/');
});

test('Returns single / for given /', () => {
	expect(normalizePath('/')).toBe('/');
});

test('Returns single character paths immediately', () => {
	expect(normalizePath('r')).toBe('r');
});

const cases: [string, string][] = [
	['../test/path', '../test/path'],
	['..\\test\\path', '../test/path'],
	['/test/path/', '/test/path'],
	['C:\\\\test\\path', 'C:/test/path'],
	['\\?\\C:\\test\\path', '/?/C:/test/path'],
	['\\\\.\\CdRomX', '//./CdRomX'],
];

for (const [before, after] of cases) {
	test(before, () => {
		expect(normalizePath(before)).toBe(after);
	});
}

test('Strips leading when option is set', () => {
	expect(normalizePath('/test', { removeLeading: true })).toBe('test');
});
