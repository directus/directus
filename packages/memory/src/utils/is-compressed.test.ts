import { expect, test } from 'vitest';
import { isCompressed } from './is-compressed.js';

test('Returns false if byte length is less than 19', () => {
	const mockArray = new Uint8Array([1, 2, 3]);

	expect(isCompressed(mockArray)).toBe(false);
});

test('Returns false if first byte does not match magic number', () => {
	const mockArray = new Uint8Array([0, 0x8b, 0x08, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

	expect(isCompressed(mockArray)).toBe(false);
});

test('Returns false if second byte does not match magic number', () => {
	const mockArray = new Uint8Array([0x1f, 0, 0x08, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

	expect(isCompressed(mockArray)).toBe(false);
});

test('Returns false if third byte does not compression flag', () => {
	const mockArray = new Uint8Array([0x1f, 0x8b, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

	expect(isCompressed(mockArray)).toBe(false);
});

test('Returns true if third byte does not compression flag', () => {
	const mockArray = new Uint8Array([0x1f, 0x8b, 0x08, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

	expect(isCompressed(mockArray)).toBe(true);
});
