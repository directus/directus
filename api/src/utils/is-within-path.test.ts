import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { isWithinPath } from './is-within-path.js';

describe('isWithinPath', () => {
	test('returns true for the directory itself', () => {
		expect(isWithinPath('extensions', 'extensions')).toBe(true);
	});

	test('returns true for a path inside the directory', () => {
		expect(isWithinPath('extensions/nested/pwn.js', 'extensions')).toBe(true);
	});

	test('returns false for a path outside the directory', () => {
		expect(isWithinPath('uploads/file.txt', 'extensions')).toBe(false);
	});

	test('returns false for a sibling directory sharing the same prefix', () => {
		expect(isWithinPath('extensions-public/pwn.js', 'extensions')).toBe(false);
	});

	test('returns false for a path traversing out of the directory', () => {
		expect(isWithinPath('extensions/../uploads/file.txt', 'extensions')).toBe(false);
	});

	test('returns true for any relative path when the directory is empty', () => {
		expect(isWithinPath('extensions/pwn.js', '')).toBe(true);
	});

	test('compares absolute and relative paths', () => {
		expect(isWithinPath(path.resolve('extensions/pwn.js'), 'extensions')).toBe(true);
		expect(isWithinPath('extensions/pwn.js', path.resolve('extensions'))).toBe(true);
	});

	test('returns true for any path within the filesystem root', () => {
		const root = path.parse(process.cwd()).root;

		expect(isWithinPath(path.join(root, 'srv', 'uploads', 'file.txt'), root)).toBe(true);
	});
});
