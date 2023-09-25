import { createError } from '@directus/errors';
import { describe, expect, test } from 'vitest';
import { sanitizeError } from './sanitize-error.js';

describe('sanitizeError', () => {
	test('removes stack trace from Error', () => {
		const error = new Error('test message', {
			cause: 'test',
		});

		const result = sanitizeError(error);

		expect(result.stack).toBe(undefined);
		expect(result.message).toBe(error.message);
		expect(result.cause).toBe(error.cause);
	});

	test('removes stack trace from DirectusError', () => {
		const DummyError = createError<{ more: string }>('TEAPOT', 'test message', 418);
		const error = new DummyError({ more: 'info' });

		const result = sanitizeError(error);

		expect(result.stack).toBe(undefined);
		expect(result.message).toBe(error.message);
		expect(result.code).toBe(error.code);
		expect(result.status).toBe(error.status);
		expect(result.extensions).toStrictEqual(result.extensions);
	});
});
