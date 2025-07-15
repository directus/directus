import { expectTypeOf, test } from 'vitest';
import type { DirectusExtensionsError } from '@directus/types';
import { ErrorCode } from './codes.js';
import { ContainsNullValuesError, type ContainsNullValuesErrorExtensions } from './errors/contains-null-values.js';
import { ContentTooLargeError } from './errors/content-too-large.js';
import { isDirectusError } from './is-directus-error.js';

test('Guards input as DirectusError', () => {
	expectTypeOf(isDirectusError).guards.toEqualTypeOf<DirectusExtensionsError<unknown>>();
});

test('Returns specific type when provided code for built-in error', () => {
	const contentTooLargeError = new ContentTooLargeError();

	if (isDirectusError(contentTooLargeError, ErrorCode.ContentTooLarge)) {
		expectTypeOf(contentTooLargeError).toEqualTypeOf<DirectusExtensionsError<never>>();
	}

	const containsNullValuesError = new ContainsNullValuesError({ collection: 'sample', field: 'sample' });

	if (isDirectusError(containsNullValuesError, ErrorCode.ContainsNullValues)) {
		expectTypeOf(containsNullValuesError).toEqualTypeOf<DirectusExtensionsError<ContainsNullValuesErrorExtensions>>();
	}
});

test('Returns unknown when provided code is not a built-in error', () => {
	const error = { name: 'DirectusError', code: 'CustomError' };

	if (isDirectusError(error, error.code)) {
		expectTypeOf(error).toEqualTypeOf<DirectusExtensionsError<unknown>>();
	}
});

test('Allows to pass custom extensions type', () => {
	const error = { name: 'DirectusError' };

	type CustomDirectusErrorExtensions = { custom: string };

	if (isDirectusError<CustomDirectusErrorExtensions>(error)) {
		expectTypeOf(error).toEqualTypeOf<DirectusExtensionsError<CustomDirectusErrorExtensions>>();
	}
});
