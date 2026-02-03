import { describe, expect, it } from 'vitest';
import { stringByteSize } from './get-string-byte-size.js';

describe('stringByteSize', () => {
	it('returns 0 for empty string', () => {
		expect(stringByteSize('')).toBe(0);
	});

	it('returns correct size for ASCII characters', () => {
		expect(stringByteSize('hello')).toBe(5);
	});

	it('returns correct size for single ASCII character', () => {
		expect(stringByteSize('a')).toBe(1);
	});

	it('returns correct size for string with spaces', () => {
		expect(stringByteSize('hello world')).toBe(11);
	});

	it('returns correct size for multi-byte UTF-8 characters', () => {
		// é is 2 bytes in UTF-8
		expect(stringByteSize('é')).toBe(2);
	});

	it('returns correct size for emoji', () => {
		// Most emoji are 4 bytes in UTF-8
		expect(stringByteSize('😀')).toBe(4);
	});

	it('returns correct size for mixed ASCII and multi-byte characters', () => {
		// "café" = c(1) + a(1) + f(1) + é(2) = 5 bytes
		expect(stringByteSize('café')).toBe(5);
	});

	it('returns correct size for Chinese characters', () => {
		// Chinese characters are typically 3 bytes each in UTF-8
		expect(stringByteSize('中文')).toBe(6);
	});

	it('returns correct size for numbers as string', () => {
		expect(stringByteSize('12345')).toBe(5);
	});

	it('returns correct size for special characters', () => {
		expect(stringByteSize('!@#$%')).toBe(5);
	});

	it('returns correct size for newline characters', () => {
		expect(stringByteSize('\n')).toBe(1);
		expect(stringByteSize('\r\n')).toBe(2);
	});

	it('returns correct size for tab character', () => {
		expect(stringByteSize('\t')).toBe(1);
	});
});
