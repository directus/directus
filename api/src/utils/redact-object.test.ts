import { getRedactedString, REDACTED_TEXT } from '@directus/utils';
import { merge } from 'lodash-es';
import { describe, expect, test } from 'vitest';
import { getReplacer, redactObject } from './redact-object.js';

const input = {
	$trigger: {
		event: 'users.create',
		payload: {
			first_name: 'Example',
			last_name: 'User',
			email: 'user@example.com',
			password: 'secret',
		},
		key: 'eb641950-fffa-4388-8606-aede594ae487',
		collection: 'directus_users',
	},
	exec_fm27u: {
		$trigger: {
			event: 'users.create',
			payload: {
				first_name: 'Example',
				last_name: 'User',
				email: 'user@example.com',
				password: 'secret',
			},
			key: 'eb641950-fffa-4388-8606-aede594ae487',
			collection: 'directus_users',
		},
		$last: {
			event: 'users.create',
			payload: {
				first_name: 'Example',
				last_name: 'User',
				email: 'user@example.com',
				password: 'secret',
			},
			key: 'eb641950-fffa-4388-8606-aede594ae487',
			collection: 'directus_users',
		},
	},
};

test('should not mutate input', () => {
	const result = redactObject(input, { keys: [['$trigger']] }, getRedactedString);

	expect(result).not.toBe(input);
});

test('should support single level path', () => {
	const result = redactObject(input, { keys: [['$trigger']] }, getRedactedString);

	expect(result).toEqual(
		merge({}, input, {
			$trigger: REDACTED_TEXT,
		}),
	);
});

test('should support multi level path', () => {
	const result = redactObject(input, { keys: [['$trigger', 'payload', 'password']] }, getRedactedString);

	expect(result).toEqual(
		merge({}, input, {
			$trigger: {
				payload: { password: REDACTED_TEXT },
			},
		}),
	);
});

test('should support wildcard path', () => {
	const result = redactObject(input, { keys: [['*', 'payload']] }, getRedactedString);

	expect(result).toEqual(
		merge({}, input, {
			$trigger: {
				payload: REDACTED_TEXT,
			},
		}),
	);
});

test('should support deep path', () => {
	const result = redactObject(input, { keys: [['**', 'password']] }, getRedactedString);

	expect(result).toMatchObject(
		merge({}, input, {
			$trigger: {
				payload: {
					password: REDACTED_TEXT,
				},
			},
			exec_fm27u: {
				$trigger: {
					payload: {
						password: REDACTED_TEXT,
					},
				},
				$last: {
					payload: {
						password: REDACTED_TEXT,
					},
				},
			},
		}),
	);
});

test('should support multiple paths', () => {
	const result = redactObject(
		input,
		{
			keys: [
				['$trigger', 'key'],
				['*', 'payload', 'email'],
				['**', 'password'],
			],
		},
		getRedactedString,
	);

	expect(result).toEqual(
		merge({}, input, {
			$trigger: {
				key: REDACTED_TEXT,
				payload: {
					email: REDACTED_TEXT,
					password: REDACTED_TEXT,
				},
			},
			exec_fm27u: {
				$trigger: {
					payload: {
						password: REDACTED_TEXT,
					},
				},
				$last: {
					payload: {
						password: REDACTED_TEXT,
					},
				},
			},
		}),
	);
});

describe('getReplacer tests', () => {
	test('Returns parsed error object', () => {
		const errorMessage = 'Error Message';
		const errorCause = 'Error Cause';
		const replacer = getReplacer(getRedactedString);
		const result: any = replacer('', new Error(errorMessage, { cause: errorCause }));
		expect(result.name).toBe('Error');
		expect(result.message).toBe(errorMessage);
		expect(result.stack).toBeDefined();
		expect(result.cause).toBe(errorCause);
	});

	test('Returns other types as is', () => {
		const values = [
			undefined,
			null,
			0,
			1,
			true,
			false,
			'',
			'abc',
			[],
			['123'],
			{},
			{ abc: '123' },
			() => {
				// empty
			},
		];

		const replacer = getReplacer(getRedactedString);

		for (const value of values) {
			expect(replacer('', value)).toEqual(value);
		}
	});

	test('Correctly parses object with circular structure when used with JSON.stringify()', () => {
		const obj: Record<string, any> = {
			a: 'foo',
		};

		obj['b'] = obj;
		obj['c'] = { obj };
		obj['d'] = [obj];

		const expectedResult = {
			a: 'foo',
			b: '[Circular]',
			c: { obj: '[Circular]' },
			d: ['[Circular]'],
		};

		const result = JSON.parse(JSON.stringify(obj, getReplacer(getRedactedString)));

		expect(result).toStrictEqual(expectedResult);
	});

	test('Correctly parses object with repeatedly occurring same refs', () => {
		const ref = {};

		const obj: Record<string, any> = {
			a: ref,
			b: ref,
		};

		const expectedResult = {
			a: ref,
			b: ref,
		};

		const result = JSON.parse(JSON.stringify(obj, getReplacer(getRedactedString)));

		expect(result).toStrictEqual(expectedResult);
	});

	test('Correctly parses error object when used with JSON.stringify()', () => {
		const errorMessage = 'Error Message';
		const errorCause = 'Error Cause';

		const baseValue = {
			string: 'abc',
			num: 123,
			bool: true,
			null: null,
		};

		const objWithError = {
			...baseValue,
			error: new Error(errorMessage, { cause: errorCause }),
		};

		const expectedResult = {
			...baseValue,
			error: { name: 'Error', message: errorMessage, cause: errorCause },
		};

		const result = JSON.parse(JSON.stringify(objWithError, getReplacer(getRedactedString)));

		// Stack changes depending on env
		expect(result.error.stack).toBeDefined();
		delete result.error.stack;

		expect(result).toStrictEqual(expectedResult);
	});

	test('Correctly redacts values when used with JSON.stringify()', () => {
		const baseValue = {
			num: 123,
			bool: true,
			null: null,
			string_ignore: `No error Cause it's case sensitive~~`,
		};

		const objWithError = {
			...baseValue,
			string: `Replace cause case matches Errors~~`,
			nested: { another_str: 'just because of safety 123456' },
			nested_array: [{ str_a: 'cause surely' }, { str_b: 'not an Error' }, { str_ignore: 'nothing here' }],
			array: ['something', 'no Error', 'just because', 'all is good'],
			error: new Error('This is an Error message.', { cause: 'Here is an Error cause!' }),
		};

		const expectedResult = {
			...baseValue,
			string: `Replace ${getRedactedString('cause')} case matches ${getRedactedString('ERROR')}s~~`,
			nested: { another_str: `just be${getRedactedString('cause')} of safety 123456` },
			nested_array: [
				{ str_a: `${getRedactedString('cause')} surely` },
				{ str_b: `not an ${getRedactedString('ERROR')}` },
				{ str_ignore: 'nothing here' },
			],
			array: ['something', `no ${getRedactedString('ERROR')}`, `just be${getRedactedString('cause')}`, 'all is good'],
			error: {
				name: getRedactedString('ERROR'),
				message: `This is an ${getRedactedString('ERROR')} message.`,
				cause: `Here is an ${getRedactedString('ERROR')} ${getRedactedString('cause')}!`,
			},
		};

		const result = JSON.parse(
			JSON.stringify(
				objWithError,
				getReplacer(getRedactedString, {
					empty: '',
					ERROR: 'Error',
					cause: 'cause',
					number: 123456,
				}),
			),
		);

		// Stack changes depending on env
		expect(result.error.stack).toBeDefined();
		delete result.error.stack;

		expect(result).toStrictEqual(expectedResult);
	});
});
