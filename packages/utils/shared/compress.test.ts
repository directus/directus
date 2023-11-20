import { describe, test, expect } from 'vitest';
import { compress, decompress, mapToSortedArray, encode, decode, to36, to10, getValueForToken } from './compress.js';

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

const arr = ['directus', false, deep];

const geoJSON = {
	data: [
		{
			id: 'f36431ea-0d25-4747-8b37-185eb3ba66d0',
			point1: {
				type: 'Point',
				coordinates: [-107.57812499999984, 34.30714385628873],
			},
			point2: {
				type: 'Point',
				coordinates: [-91.25923790168956, 42.324763327278106],
			},
		},
	],
};

const dateString = '2022-02-14T01:02:11.000Z';

const dateInput = {
	date_created: new Date(dateString),
};

const dateOutput = {
	date_created: dateString,
};

describe('compress', () => {
	test('Compresses plain objects', () => {
		expect(compress(plain)).toBe(
			'string|directus|true|false|null|empty|integer|float|undefined^1K6^12.34^$0|1|2|-1|3|-2|4|-3|5|-4|6|9|7|A|8|-5]',
		);
	});

	test('Compresses deep nested objects', () => {
		expect(compress(deep)).toBe(
			'another|string|directus|true|false|null|empty|integer|float|undefined|nested|arr^1K6^12.34^$0|$1|2|3|-1|4|-2|5|-3|6|-4|7|C|8|D|9|-5]|A|$1|2|3|-1|4|-2|5|-3|6|-4|7|C|8|D|9|-5]|B|@$1|2|3|-1|4|-2|5|-3|6|-4|7|C|8|D|9|-5]|$1|2|3|-1|4|-2|5|-3|6|-4|7|C|8|D|9|-5]]]',
		);
	});

	test('Compresses array input', () => {
		expect(compress(arr)).toBe(
			'directus|another|string|true|false|null|empty|integer|float|undefined|nested|arr^1K6^12.34^@0|-2|$1|$2|0|3|-1|4|-2|5|-3|6|-4|7|C|8|D|9|-5]|A|$2|0|3|-1|4|-2|5|-3|6|-4|7|C|8|D|9|-5]|B|@$2|0|3|-1|4|-2|5|-3|6|-4|7|C|8|D|9|-5]|$2|0|3|-1|4|-2|5|-3|6|-4|7|C|8|D|9|-5]]]]',
		);
	});

	test('Compresses GeoJSON format reliably', () => {
		expect(compress(geoJSON)).toBe(
			'data|id|f36431ea-0d25-4747-8b37-185eb3ba66d0|point1|type|Point|coordinates|point2^^-107.57812499999984|34.30714385628873|-91.25923790168956|42.324763327278106^$0|@$1|2|3|$4|5|6|@8|9]]|7|$4|5|6|@A|B]]]]]',
		);
	});

	test('Compresses Date objects into strings', () => {
		expect(compress(dateInput)).toBe('date_created|2022-02-14T01:02:11.000Z^^^$0|1]');
	});

	test('Throws error on non-supported types', () => {
		expect(() => compress({ method: () => true })).toThrowError();
	});
});

describe('decompress', () => {
	test('Decompresses plain objects', () => {
		expect(
			decompress(
				'string|directus|true|false|null|empty|integer|float|undefined^1K6^12.34^$0|1|2|-1|3|-2|4|-3|5|-4|6|9|7|A|8|-5]',
			),
		).toEqual(plain);
	});

	test('Decompresses deep nested objects', () => {
		expect(
			decompress(
				'another|string|directus|true|false|null|empty|integer|float|undefined|nested|arr^1K6^12.34^$0|$1|2|3|-1|4|-2|5|-3|6|-4|7|C|8|D|9|-5]|A|$1|2|3|-1|4|-2|5|-3|6|-4|7|C|8|D|9|-5]|B|@$1|2|3|-1|4|-2|5|-3|6|-4|7|C|8|D|9|-5]|$1|2|3|-1|4|-2|5|-3|6|-4|7|C|8|D|9|-5]]]',
			),
		).toEqual(deep);
	});

	test('Decompresses arrays', () => {
		expect(
			decompress(
				'directus|another|string|true|false|null|empty|integer|float|undefined|nested|arr^1K6^12.34^@0|-2|$1|$2|0|3|-1|4|-2|5|-3|6|-4|7|C|8|D|9|-5]|A|$2|0|3|-1|4|-2|5|-3|6|-4|7|C|8|D|9|-5]|B|@$2|0|3|-1|4|-2|5|-3|6|-4|7|C|8|D|9|-5]|$2|0|3|-1|4|-2|5|-3|6|-4|7|C|8|D|9|-5]]]]',
			),
		).toEqual(arr);
	});

	test('Decompresses GeoJSON properly', () => {
		expect(
			decompress(
				'data|id|f36431ea-0d25-4747-8b37-185eb3ba66d0|point1|type|Point|coordinates|point2^^-107.57812499999984|34.30714385628873|-91.25923790168956|42.324763327278106^$0|@$1|2|3|$4|5|6|@8|9]]|7|$4|5|6|@A|B]]]]]',
			),
		).toEqual(geoJSON);
	});

	test('Decompresses Date strings', () => {
		expect(decompress('date_created|2022-02-14T01:02:11.000Z^^^$0|1]')).toEqual(dateOutput);
	});

	test('Errors when not enough parts exist', () => {
		expect(() => decompress('a|b^1K6^')).toThrowError();
	});

	test('Errors on illegal ending token', () => {
		expect(() => decompress('^^^]')).toThrowError();
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
				]),
			),
		).toEqual(['a', 'b', 'c']);
	});
});

describe('encode', () => {
	test('Encodes special characters used in compressed string to URL encoded', () => {
		const input = 'hello + | ^ % end';
		expect(encode(input)).toBe('hello+%2B+%7C+%5E+%25+end');
	});
});

describe('decode', () => {
	test('Decodes special characters used in decompressed string to URL encoded', () => {
		const input = 'hello+%2B+%7C+%5E+%25+end';
		expect(decode(input)).toBe('hello + | ^ % end');
	});
});

describe('to36', () => {
	test('Converts base10 number to capitalized base36 equivalent', () => {
		expect(to36(23)).toBe('N');
		expect(to36(506999)).toBe('AV7B');
		expect(to36(3226393)).toBe('1X5I1');
	});
});

describe('to10', () => {
	test('Converts base36 number to capitalized base10 equivalent', () => {
		expect(to10('N')).toBe(23);
		expect(to10('AV7B')).toBe(506999);
		expect(to10('1X5I1')).toBe(3226393);
	});
});

describe('getValueForToken', () => {
	test('Returns correct values for tokens', () => {
		expect(getValueForToken(-1)).toBe(true);
		expect(getValueForToken(-2)).toBe(false);
		expect(getValueForToken(-3)).toBe(null);
		expect(getValueForToken(-4)).toBe('');
		expect(getValueForToken(-5)).toBe(undefined);
	});
});
