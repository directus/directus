import type { ValidationErrorItem } from 'joi';
import { describe, expect, test } from 'vitest';
import { joiValidationErrorItemToErrorExtensions } from './joi-to-error-extensions.js';

function buildItem(
	type: string,
	context?: Record<string, unknown>,
	path: (string | number)[] = ['amount'],
): ValidationErrorItem {
	return {
		message: `Validation failed (${type})`,
		path,
		type,
		context,
	} as unknown as ValidationErrorItem;
}

describe('joiValidationErrorItemToErrorExtensions', () => {
	test('maps number.less to lt with the configured limit', () => {
		const extensions = joiValidationErrorItemToErrorExtensions(buildItem('number.less', { limit: 10000 }));
		expect(extensions.type).toBe('lt');
		expect(extensions.valid).toBe(10000);
	});

	test('maps number.unsafe to the generic regex type instead of throwing', () => {
		const value = 10000000000000000;

		const extensions = joiValidationErrorItemToErrorExtensions(buildItem('number.unsafe', { value }));

		expect(extensions.type).toBe('regex');
		expect(extensions.invalid).toBe(value);
	});

	test.each([['number.infinity'], ['number.precision'], ['number.integer'], ['number.multiple'], ['number.port']])(
		'falls back to regex for unhandled numeric Joi type %s',
		(joiType) => {
			const extensions = joiValidationErrorItemToErrorExtensions(buildItem(joiType, { value: 1 }));
			expect(extensions.type).toBe('regex');
		},
	);

	test('still throws for completely unrecognized Joi types', () => {
		expect(() => joiValidationErrorItemToErrorExtensions(buildItem('something.weird'))).toThrow();
	});
});
