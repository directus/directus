import { expect, test } from 'vitest';
import { stringByteSize } from './get-string-byte-size.js';

test('Returns correct byte size for given input string', () => {
	expect(stringByteSize('test')).toBe(4);
	expect(stringByteSize('🐡')).toBe(4);
	expect(stringByteSize('👨‍👧‍👦')).toBe(18);
});
