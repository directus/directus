import { expect, test } from 'vitest';
import { toBytes } from './to-bytes.js';

test.each([
	['10mb', 10_485_760],
	['1kb', 1024],
	['512', 512],
	[8_388_608, 8_388_608],
])('Parses %j into %j', (value, expected) => {
	expect(toBytes(value)).toBe(expected);
});

test.each([[''], ['not a size'], [undefined], [null], [false], [{}]])('Returns undefined for %j', (value) => {
	expect(toBytes(value)).toBeUndefined();
});
