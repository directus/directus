import { expect, test } from 'vitest';
import { bufferToUint8Array } from './buffer-to-uint8array.js';

test('Returns Uint8Array matching Buffer', () => {
	const text = 'Hello World';

	const buffer = Buffer.from(text);

	const arr = bufferToUint8Array(buffer);

	expect(arr).toBeInstanceOf(Uint8Array);
	expect(new TextDecoder().decode(arr)).toBe(text);
});
