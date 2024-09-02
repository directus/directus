import { uint8ArrayToString } from './uint8array-to-string.js';
import { test, expect } from 'vitest';

test('Converts uint8array to string', () => {
	const uint8Array = new Uint8Array([104, 101, 108, 108, 111]);
	const string = 'hello';

	expect(uint8ArrayToString(uint8Array)).toEqual(string);
});
