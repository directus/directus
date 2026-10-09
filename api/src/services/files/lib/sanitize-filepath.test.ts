import { describe, expect, test } from 'vitest';
import { sanitizeFilepath } from './sanitize-filepath.js';

describe('sanitizeFilepath', () => {
	test('leaves a plain relative path untouched', () => {
		expect(sanitizeFilepath('folder/file.jpg')).toBe('folder/file.jpg');
	});

	test('strips a leading slash', () => {
		expect(sanitizeFilepath('/folder/file.jpg')).toBe('folder/file.jpg');
	});

	test('strips a leading ./', () => {
		expect(sanitizeFilepath('./file.jpg')).toBe('file.jpg');
	});

	test('clamps ../ traversal to the root', () => {
		expect(sanitizeFilepath('../../etc/passwd')).toBe('etc/passwd');
	});

	test('resolves interior ../ segments', () => {
		expect(sanitizeFilepath('/folder/../new-file.jpg')).toBe('new-file.jpg');
		expect(sanitizeFilepath('a/../../b.jpg')).toBe('b.jpg');
	});

	test('normalizes empty / root inputs to an empty string', () => {
		expect(sanitizeFilepath('')).toBe('');
		expect(sanitizeFilepath('.')).toBe('');
		expect(sanitizeFilepath('/')).toBe('');
	});
});
