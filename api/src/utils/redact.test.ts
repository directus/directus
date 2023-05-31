import { REDACTED_TEXT } from '@directus/constants';
import { merge } from 'lodash-es';
import { describe, expect, test } from 'vitest';
import { errorReplacer, redact } from './redact.js';

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
	const result = redact(input, [['$trigger']], REDACTED_TEXT);

	expect(result).not.toBe(input);
});

test('should support single level path', () => {
	const result = redact(input, [['$trigger']], REDACTED_TEXT);

	expect(result).toEqual(
		merge({}, input, {
			$trigger: REDACTED_TEXT,
		})
	);
});

test('should support multi level path', () => {
	const result = redact(input, [['$trigger', 'payload', 'password']], REDACTED_TEXT);

	expect(result).toEqual(
		merge({}, input, {
			$trigger: {
				payload: { password: REDACTED_TEXT },
			},
		})
	);
});

test('should support wildcard path', () => {
	const result = redact(input, [['*', 'payload']], REDACTED_TEXT);

	expect(result).toEqual(
		merge({}, input, {
			$trigger: {
				payload: REDACTED_TEXT,
			},
		})
	);
});

test('should support deep path', () => {
	const result = redact(input, [['**', 'password']], REDACTED_TEXT);

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
		})
	);
});

test('should support multiple paths', () => {
	const result = redact(
		input,
		[
			['$trigger', 'key'],
			['*', 'payload', 'email'],
			['**', 'password'],
		],
		REDACTED_TEXT
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
		})
	);
});

describe('errorReplacer tests', () => {
	test('Returns parsed error object', () => {
		const errorMessage = 'Error Message';
		const errorCause = 'Error Cause';
		const result = errorReplacer('', new Error(errorMessage, { cause: errorCause }));
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

		for (const value of values) {
			expect(errorReplacer('', value)).toBe(value);
		}
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

		const result = JSON.parse(JSON.stringify(objWithError, errorReplacer));

		// Stack changes depending on env
		expect(result.error.stack).toBeDefined();
		delete result.error.stack;

		expect(result).toStrictEqual(expectedResult);
	});
});
