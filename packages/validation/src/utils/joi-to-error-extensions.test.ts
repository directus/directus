import type { ValidationErrorItem } from 'joi';
import { describe, expect, test } from 'vitest';
import { joiValidationErrorItemToErrorExtensions } from './joi-to-error-extensions.js';

const item = (type: string, context: Record<string, unknown> = {}): ValidationErrorItem => ({
	message: '',
	path: ['field'],
	type,
	context: { label: 'field', key: 'field', ...context },
});

describe('joiValidationErrorItemToErrorExtensions', () => {
	test.each(['contains', 'icontains', 'ncontains', 'nicontains'])('should map string.%s', (type) => {
		expect(joiValidationErrorItemToErrorExtensions(item(`string.${type}`, { substring: 'abc' }))).toEqual({
			field: 'field',
			path: [],
			type,
			substring: 'abc',
		});
	});

	test.each([
		['string.ieq', { valid: 'Abc' }, { type: 'ieq', valid: 'Abc' }],
		['string.nieq', { invalid: 'Abc' }, { type: 'nieq', invalid: 'Abc' }],
	])('should map %s', (type, context, expected) => {
		expect(joiValidationErrorItemToErrorExtensions(item(type, context))).toEqual({
			field: 'field',
			path: [],
			...expected,
		});
	});

	test.each(['any.required', 'string.base', 'alternatives.types'])('should map %s to required', (type) => {
		expect(joiValidationErrorItemToErrorExtensions(item(type))).toMatchObject({ type: 'required' });
	});

	test('should throw for unknown error types', () => {
		expect(() => joiValidationErrorItemToErrorExtensions(item('unknown.type'))).toThrow();
	});
});
