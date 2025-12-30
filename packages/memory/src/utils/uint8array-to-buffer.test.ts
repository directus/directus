import { uint8ArrayToBuffer } from './uint8array-to-buffer.js';
import { expect, test } from 'vitest';

test('Converts uint8array to buffer equivalent', () => {
	const uint8Array = new Uint8Array([1, 2, 3]);
	const buffer = Buffer.from([1, 2, 3]);

	expect(uint8ArrayToBuffer(uint8Array)).toEqual(buffer);
});
