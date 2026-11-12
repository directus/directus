import { createError, ForbiddenError } from '@directus/errors';
import { FailedValidationError } from '@directus/validation';
import { expect, test } from 'vitest';
import { serializeErrors } from './serialize-errors.js';

test('Returns non-error values as is', () => {
	expect(serializeErrors(null)).toBe(null);
	expect(serializeErrors('error')).toBe('error');
	expect(serializeErrors({ a: [1, { b: 2 }] })).toEqual({ a: [1, { b: 2 }] });
});

test('Converts a plain error to a plain object without stack', () => {
	const serialized = serializeErrors(new TypeError('Test error'));

	expect(serialized).toEqual({ name: 'TypeError', message: 'Test error' });
	expect(serialized).not.toBeInstanceOf(Error);
});

test('Keeps code, status and extensions of Directus errors', () => {
	expect(serializeErrors(new ForbiddenError({ reason: 'Nope' }))).toEqual({
		name: 'DirectusError',
		message: 'Nope',
		code: 'FORBIDDEN',
		status: 403,
		extensions: { reason: 'Nope' },
	});
});

test('Converts errors nested in arrays and objects', () => {
	const validationError = new FailedValidationError({ field: 'title', path: [], type: 'nnull' });

	expect(serializeErrors([validationError])).toEqual([
		{
			name: 'DirectusError',
			message: validationError.message,
			code: 'FAILED_VALIDATION',
			status: 400,
			extensions: validationError.extensions,
		},
	]);

	expect(serializeErrors({ error: new Error('Nested') })).toEqual({ error: { name: 'Error', message: 'Nested' } });
});

test('Omits unknown properties that might contain sensitive data', () => {
	const error = Object.assign(new Error('Request failed'), {
		code: 'ERR_BAD_REQUEST',
		config: { headers: { Authorization: 'Bearer secret' } },
		extensions: { token: 'secret' },
	});

	expect(serializeErrors(error)).toEqual({ name: 'Error', message: 'Request failed', code: 'ERR_BAD_REQUEST' });
});

test('Serializes error causes and handles circular causes', () => {
	const error = new Error('Outer');
	const cause = new Error('Inner', { cause: error });
	error.cause = cause;

	expect(serializeErrors(error)).toEqual({
		name: 'Error',
		message: 'Outer',
		cause: { name: 'Error', message: 'Inner' },
	});

	expect(serializeErrors(new Error('Outer', { cause: { secret: 'value' } }))).toEqual({
		name: 'Error',
		message: 'Outer',
	});
});

test('Serializes errors nested in Directus error extensions', () => {
	const NestedError = createError<{ error: Error }>('NESTED', 'Nested error', 500);
	const inner = Object.assign(new Error('Inner'), { config: { headers: { Authorization: 'Bearer secret' } } });

	expect(serializeErrors(new NestedError({ error: inner }))).toEqual({
		name: 'DirectusError',
		message: 'Nested error',
		code: 'NESTED',
		status: 500,
		extensions: { error: { name: 'Error', message: 'Inner' } },
	});
});
