import { expect, expectTypeOf, test } from 'vitest';
import { ErrorCode } from './codes.js';
import { type DirectusError } from './create-error.js';
import type { ContainsNullValuesErrorExtensions } from './errors/contains-null-values.js';
import { isDirectusError } from './is-directus-error.js';

test('Guards input as DirectusError', () => {
	expectTypeOf(isDirectusError).guards.toEqualTypeOf<DirectusError<unknown>>();
});

test('Returns specific type when provided code for built-in error', () => {
	const error = { name: 'DirectusError', code: ErrorCode.ContainsNullValues };

	expect.assertions(1);

	if (isDirectusError(error, ErrorCode.ContainsNullValues)) {
		expectTypeOf(error).toMatchTypeOf<DirectusError<ContainsNullValuesErrorExtensions>>();
	}
});

test('Allows to pass custom extensions type', () => {
	const error = { name: 'DirectusError' };

	expect.assertions(1);

	type CustomDirectusErrorExtensions = { custom: string };

	if (isDirectusError<CustomDirectusErrorExtensions>(error)) {
		expectTypeOf(error).toMatchTypeOf<DirectusError<CustomDirectusErrorExtensions>>();
	}
});
