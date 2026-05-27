import { expect, test } from 'vitest';
import { isHex } from '@/utils/is-hex';

test('Returns true for valid hex', () => {
	const cases = ['#64f', '#64ff', '#6644ff', '#6644ffff'];
	cases.forEach((testCase) => expect(isHex(testCase)).toBe(true));
});

test('Returns false for anything non-hash', () => {
	const cases = ['123', 'hello', 'rgba(255, 255, 255, 0)', 'hsl(123, 123, 123)'];
	cases.forEach((testCase) => expect(isHex(testCase)).toBe(false));
});
