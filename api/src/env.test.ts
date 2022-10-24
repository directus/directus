import { describe, beforeEach, afterEach, test, expect, vi } from 'vitest';

const testEnv = {
	NUMBER: '1234',
	NUMBER_CAST_AS_STRING: 'string:1234',
	REGEX: 'regex:\\.example\\.com$',
	CSV: 'one,two,three,four',
	CSV_CAST_AS_STRING: 'string:one,two,three,four',
	MULTIPLE: 'array:string:https://example.com,regex:\\.example2\\.com$',
};

describe('env processed values', () => {
	const originalEnv = process.env;
	let env: Record<string, any>;

	beforeEach(async () => {
		vi.resetModules();
		process.env = { ...testEnv };
		env = await vi.importActual('../src/env');
	});

	afterEach(() => {
		process.env = originalEnv;
		vi.resetAllMocks();
	});

	test('Number value should be a number', () => {
		expect(env.default.NUMBER).toStrictEqual(1234);
	});

	test('Number value casted as string should be a string', () => {
		expect(env.default.NUMBER_CAST_AS_STRING).toStrictEqual('1234');
	});

	test('Value casted as regex', () => {
		expect(env.default.REGEX).toBeInstanceOf(RegExp);
	});

	test('CSV value should be an array', () => {
		expect(env.default.CSV).toStrictEqual(['one', 'two', 'three', 'four']);
	});

	test('CSV value casted as string should be a string', () => {
		expect(env.default.CSV_CAST_AS_STRING).toStrictEqual('one,two,three,four');
	});

	test('Multiple type cast', () => {
		expect(env.default.MULTIPLE).toStrictEqual(['https://example.com', /\.example2\.com$/]);
	});
});
