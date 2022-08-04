import { describe, test, expect } from 'vitest';
import { compress, decompress, mapToSortedArray, encode, to36 } from './compress';

const plain = {
	string: 'directus',
	true: true,
	false: false,
	null: null,
	empty: '',
	integer: 2022,
	float: 12.34,
	undefined: undefined,
};

const deep = {
	another: plain,
	nested: plain,
	arr: [plain, plain],
};

const arr = [plain, deep];

describe('compress', () => {
	test('Compresses plain objects', () => {
		expect(compress(plain)).toMatchInlineSnapshot(
			'"string|directus|true|false|null|empty|integer|float|undefined^1K6^12.34^$0|1|2|-1|3|-2|4|-3|5|-4|6|9|7|A|8|-5]"'
		);
	});

	test('Compresses deep nested objects', () => {
		expect(compress(deep)).toMatchInlineSnapshot(
			'"another|string|directus|true|false|null|empty|integer|float|undefined|nested|arr^1K6^12.34^$0|$1|2|3|-1|4|-2|5|-3|6|-4|7|C|8|D|9|-5]|A|$1|2|3|-1|4|-2|5|-3|6|-4|7|C|8|D|9|-5]|B|@$1|2|3|-1|4|-2|5|-3|6|-4|7|C|8|D|9|-5]|$1|2|3|-1|4|-2|5|-3|6|-4|7|C|8|D|9|-5]]]"'
		);
	});

	test('Compresses array input', () => {
		expect(compress(arr)).toMatchInlineSnapshot(
			'"string|directus|true|false|null|empty|integer|float|undefined|another|nested|arr^1K6^12.34^@$0|1|2|-1|3|-2|4|-3|5|-4|6|C|7|D|8|-5]|$9|$0|1|2|-1|3|-2|4|-3|5|-4|6|C|7|D|8|-5]|A|$0|1|2|-1|3|-2|4|-3|5|-4|6|C|7|D|8|-5]|B|@$0|1|2|-1|3|-2|4|-3|5|-4|6|C|7|D|8|-5]|$0|1|2|-1|3|-2|4|-3|5|-4|6|C|7|D|8|-5]]]]"'
		);
	});

	test('Throws error on non-supported types', () => {
		expect(() => compress({ method: () => true })).toThrowError();
	});
});

describe('decompress', () => {
	test('Decompresses plain objects', () => {
		expect(
			decompress(
				'string|directus|true|false|null|empty|integer|float|undefined^1K6^12.34^$0|1|2|-1|3|-2|4|-3|5|-4|6|9|7|A|8|-5]'
			)
		).toEqual(plain);
	});

	test('Decompresses deep nested objects', () => {
		expect(
			decompress(
				'another|string|directus|true|false|null|empty|integer|float|undefined|nested|arr^1K6^12.34^$0|$1|2|3|-1|4|-2|5|-3|6|-4|7|C|8|D|9|-5]|A|$1|2|3|-1|4|-2|5|-3|6|-4|7|C|8|D|9|-5]|B|@$1|2|3|-1|4|-2|5|-3|6|-4|7|C|8|D|9|-5]|$1|2|3|-1|4|-2|5|-3|6|-4|7|C|8|D|9|-5]]]'
			)
		).toEqual(deep);
	});

	test('Decompresses arrays', () => {
		expect(
			decompress(
				'string|directus|true|false|null|empty|integer|float|undefined|another|nested|arr^1K6^12.34^@$0|1|2|-1|3|-2|4|-3|5|-4|6|C|7|D|8|-5]|$9|$0|1|2|-1|3|-2|4|-3|5|-4|6|C|7|D|8|-5]|A|$0|1|2|-1|3|-2|4|-3|5|-4|6|C|7|D|8|-5]|B|@$0|1|2|-1|3|-2|4|-3|5|-4|6|C|7|D|8|-5]|$0|1|2|-1|3|-2|4|-3|5|-4|6|C|7|D|8|-5]]]]'
			)
		).toEqual(arr);
	});
});

describe('mapToSortedArray', () => {
	test('Returns map as array sorted by map values', () => {
		expect(
			mapToSortedArray(
				new Map([
					['b', 1],
					['a', 0],
					['c', 2],
				])
			)
		).toEqual(['a', 'b', 'c']);
	});
});

describe('encode', () => {
	test('Encodes special characters used in compressed string to URL encoded', () => {
		const input = 'hello + | ^ % end';
		expect(encode(input)).toBe('hello+%2B+%7C+%5E+%25+end');
	});
});

describe('to36', () => {
	test('Converts base10 number to capitalized base36 equivalent', () => {
		expect(to36(23)).toBe('N');
		expect(to36(506999)).toBe('AV7B');
		expect(to36(3226393)).toBe('1X5I1');
	});
});
