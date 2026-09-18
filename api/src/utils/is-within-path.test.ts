import { describe, expect, test } from 'vitest';
import { isWithinPath } from './is-within-path.js';

describe('isWithinPath', () => {
	test('returns true for any path when the directory is empty', () => {
		expect(isWithinPath('extensions/pwn.js', '')).toBe(true);
	});

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

	test('honors a custom separator', () => {
		expect(isWithinPath('C:\\dir\\templates\\mail.liquid', 'C:\\dir\\templates', '\\')).toBe(true);
		expect(isWithinPath('C:\\dir\\templates-other\\mail.liquid', 'C:\\dir\\templates', '\\')).toBe(false);
	});
});
