import { test, expect } from 'vitest';
import { compress, decompress } from './compress.js';

const cases: [string, Uint8Array][] = [
	['object', new Uint8Array([123, 34, 104, 101, 108, 108, 111, 34, 58, 34, 119, 111, 114, 108, 100, 34, 125])],
	['string', new Uint8Array([34, 72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 34])],
	['number', new Uint8Array([52, 50])],
	['boolean', new Uint8Array([116, 114, 117, 101])],
	[
		'array',
		new Uint8Array([
			91, 123, 34, 104, 101, 108, 108, 111, 34, 58, 34, 103, 111, 111, 100, 98, 121, 101, 34, 125, 44, 123, 34, 104,
			101, 108, 108, 111, 34, 58, 34, 119, 111, 114, 108, 100, 34, 125, 93,
		]),
	],
];

test.each(cases)('%s', async (_description, input) => {
	const compressed = await compress(input);

	expect(compressed).toBeInstanceOf(Uint8Array);

	const decompressed = await decompress(compressed);

	expect(decompressed).toEqual(input);
});
