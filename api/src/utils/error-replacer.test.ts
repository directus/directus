import { errorReplacer } from './error-replacer.js';
import { test, expect } from 'vitest';

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
