import { getRedactedString, REDACTED_TEXT } from '@directus/utils';
import { describe, expect, test } from 'vitest';
import { getReplacer, redactObject } from './redact-object.js';

describe('keys', () => {
	test.each([
		[
			'should redact the whole value when the path is a single key',
			{ a: { b: 1 }, c: 1 },
			[['a']],
			{ a: REDACTED_TEXT, c: 1 },
		],
		[
			'should redact only the last key when the path has several keys',
			{ a: { b: { c: 1, d: 1 } }, c: 1 },
			[['a', 'b', 'c']],
			{ a: { b: { c: REDACTED_TEXT, d: 1 } }, c: 1 },
		],
		[
			'should match any single key when a path segment is *',
			{ a: { b: 1 }, c: { b: 1, d: { b: 1 } } },
			[['*', 'b']],
			{ a: { b: REDACTED_TEXT }, c: { b: REDACTED_TEXT, d: { b: 1 } } },
		],
		[
			'should match any number of levels when a path segment is **',
			{ b: 1, a: { b: 1, c: { b: 1, d: 1 } } },
			[['**', 'b']],
			{ b: REDACTED_TEXT, a: { b: REDACTED_TEXT, c: { b: REDACTED_TEXT, d: 1 } } },
		],
		[
			'should continue with the rest of the path when ** finds a key',
			{ a: { b: { c: 1, d: 1 } }, c: 1 },
			[['**', 'b', 'c']],
			{ a: { b: { c: REDACTED_TEXT, d: 1 } }, c: 1 },
		],
		[
			'should match at any depth below a key when ** follows it',
			{ a: { b: { c: 1 } }, c: 1 },
			[['a', '**', 'c']],
			{ a: { b: { c: REDACTED_TEXT } }, c: 1 },
		],
		[
			'should apply every path when several paths are given',
			{ a: 1, b: 1, c: 1 },
			[['a'], ['b']],
			{ a: REDACTED_TEXT, b: REDACTED_TEXT, c: 1 },
		],
		[
			'should not drop an unmatched path when two paths match the same key',
			{ a: 1, b: 1 },
			[['a'], ['*', 'x'], ['b']],
			{ a: REDACTED_TEXT, b: REDACTED_TEXT },
		],
		[
			'should not count an array as a level when a path reaches one',
			{ a: [{ b: 1 }, [{ b: 1 }]] },
			[['a', 'b']],
			{ a: [{ b: REDACTED_TEXT }, [{ b: REDACTED_TEXT }]] },
		],
		[
			'should skip non-object items when a path reaches an array',
			{ a: [null, 'x', { b: 1 }] },
			[['a', 'b']],
			{ a: [null, 'x', { b: REDACTED_TEXT }] },
		],
	])('%s', (_, input, keys, output) => {
		expect(redactObject(input, { keys }, getRedactedString)).toEqual(output);
	});

	test('should leave the input unchanged when redacting', () => {
		const input = { a: { b: 1 } };

		redactObject(input, { keys: [['a', 'b']] }, getRedactedString);

		expect(input).toEqual({ a: { b: 1 } });
	});

	test('should leave the keys unchanged when redacting', () => {
		const keys = [['a'], ['*', 'b']];

		redactObject({ a: 1, x: { b: 1 } }, { keys }, getRedactedString);

		expect(keys).toEqual([['a'], ['*', 'b']]);
	});
});

describe('values', () => {
	test.each([
		[
			'should replace the value when it appears within a longer string',
			{ a: 'because' },
			{ cause: 'cause' },
			{ a: 'be--redacted:cause--' },
		],
		[
			'should replace the value when the string is nested in objects and arrays',
			{ a: { b: ['cause'] } },
			{ cause: 'cause' },
			{ a: { b: ['--redacted:cause--'] } },
		],
		[
			'should replace each value when several values are given',
			{ a: 'cause', b: 'Error' },
			{ cause: 'cause', ERROR: 'Error' },
			{ a: '--redacted:cause--', b: '--redacted:ERROR--' },
		],
		[
			'should leave the string unchanged when the value differs in case',
			{ a: 'Cause' },
			{ cause: 'cause' },
			{ a: 'Cause' },
		],
		['should ignore the value when it is empty', { a: 'secret' }, { empty: '' }, { a: 'secret' }],
		['should ignore the value when it is not a string', { a: '123456' }, { number: 123456 }, { a: '123456' }],
		[
			'should replace the value literally when it contains regex characters (issue #24641)',
			{ a: '^.+.*?^)(][}{|$' },
			{ some_password: '^.+.*?^)(][}{|$' },
			{ a: '--redacted:some_password--' },
		],
	])('%s', (_, input, values, output) => {
		expect(redactObject(input, { values }, getRedactedString)).toEqual(output);
	});
});

describe('getReplacer', () => {
	const circular: Record<string, any> = { a: 1 };
	circular['b'] = circular;

	const ref = {};

	test.each([
		[
			'should return the name, message, stack and cause when given an error',
			new Error('Error Message', { cause: 'Error Cause' }),
			{ name: 'Error', message: 'Error Message', stack: expect.any(String), cause: 'Error Cause' },
		],
		[
			"should replace the reference with '[Circular]' when an object contains itself",
			circular,
			{ a: 1, b: '[Circular]' },
		],
		[
			'should serialise each occurrence when the same object is referenced twice without a cycle',
			{ a: ref, b: ref },
			{ a: {}, b: {} },
		],
	])('%s', (_, input, output) => {
		expect(JSON.parse(JSON.stringify(input, getReplacer(getRedactedString)))).toStrictEqual(output);
	});
});
