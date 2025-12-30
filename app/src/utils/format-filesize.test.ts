import { formatFilesize } from '@/utils/format-filesize';
import { expect, test } from 'vitest';


test('Returns -- for 0 bytes', () => {
	expect(formatFilesize(0)).toBe('--');
});

test('Returns n B bytes below threshold', () => {
	expect(formatFilesize(50)).toBe('50 B');
	expect(formatFilesize(50, false)).toBe('50 B');

	expect(formatFilesize(1100)).not.toBe('1100 B');
	expect(formatFilesize(1100, false)).not.toBe('1100 B');
});

test('Returns the correct unit for given bytes (decimal)', () => {
	const testCases: [number, string][] = [
		[50, '50 B'],
		[500, '500 B'],
		[1000, '1.0 kB'],
		[1500, '1.5 kB'],
		[15e5, '1.5 MB'],
		[15e8, '1.5 GB'],
		[15e11, '1.5 TB'],
		[15e14, '1.5 PB'],
		[15e17, '1.5 EB'],
		[15e20, '1.5 ZB'],
		[15e23, '1.5 YB'],
	];

	for (const [input, output] of testCases) {
		expect(formatFilesize(input)).toBe(output);
	}
});

test('Returns the correct unit for given bytes (base 2)', () => {
	const testCases: [number, string][] = [
		[50, '50 B'],
		[500, '500 B'],
		[1000, '1000 B'],
		[1500, '1.5 KiB'],
		[15e5, '1.4 MiB'],
		[15e8, '1.4 GiB'],
		[15e11, '1.4 TiB'],
		[15e14, '1.3 PiB'],
		[15e17, '1.3 EiB'],
		[15e20, '1.3 ZiB'],
		[15e23, '1.2 YiB'],
	];

	for (const [input, output] of testCases) {
		expect(formatFilesize(input, false)).toBe(output);
	}
});
