import { describe, expect, test } from 'vitest';
import { sanitizeError } from './sanitize-error.js';
import { BaseException } from '@directus/exceptions';

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

	test('removes stack trace from BaseException', () => {
		const error = new BaseException('test message', 418, 'TEAPOT', { more: 'info' });

		const result = sanitizeError(error);

		expect(result.stack).toBe(undefined);
		expect(result.message).toBe(error.message);
		expect(result.code).toBe(error.code);
		expect(result.status).toBe(error.status);
		expect(result.extensions).toStrictEqual(result.extensions);
	});
});
