import { describe, test, expect, vi } from 'vitest';

const testEnv = {
	NUMBER: '1234',
	NUMBER_CAST_AS_STRING: 'string:1234',
	REGEX: 'regex:\\.example\\.com$',
	CSV: 'one,two,three,four',
	CSV_CAST_AS_STRING: 'string:one,two,three,four',
	MULTIPLE: 'array:string:https://example.com,regex:\\.example2\\.com$',
};

describe('env processed values', async () => {
	process.env = { ...testEnv };
	const env = ((await vi.importActual('../src/env')) as { default: Record<string, any> }).default;

	test('Number value should be a number', () => {
		expect(env['NUMBER']).toStrictEqual(1234);
	});

	test('Number value casted as string should be a string', () => {
		expect(env['NUMBER_CAST_AS_STRING']).toStrictEqual('1234');
	});

	test('Value casted as regex', () => {
		expect(env['REGEX']).toBeInstanceOf(RegExp);
	});

	test('CSV value should be an array', () => {
		expect(env['CSV']).toStrictEqual(['one', 'two', 'three', 'four']);
	});

	test('CSV value casted as string should be a string', () => {
		expect(env['CSV_CAST_AS_STRING']).toStrictEqual('one,two,three,four');
	});

	test('Multiple type cast', () => {
		expect(env['MULTIPLE']).toStrictEqual(['https://example.com', /\.example2\.com$/]);
	});
});
