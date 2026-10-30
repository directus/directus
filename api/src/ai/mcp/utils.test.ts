import { ForbiddenError, InvalidPayloadError } from '@directus/errors';
import { describe, expect, test } from 'vitest';
import { normalizeMcpErrors } from './utils.js';

describe('normalizeMcpErrors', () => {
	test('marks only invalid payload errors as recoverable', () => {
		expect(normalizeMcpErrors(new InvalidPayloadError({ reason: 'Bad' }))).toEqual([
			{ message: 'Invalid payload. Bad.', code: 'INVALID_PAYLOAD', recoverable: true },
		]);

		expect(normalizeMcpErrors(new ForbiddenError())).toEqual([
			{ message: "You don't have permission to access this.", code: 'FORBIDDEN', recoverable: false },
		]);
	});

	test('normalizes each entry of an array', () => {
		expect(normalizeMcpErrors([new Error('First'), 'Second', { message: 'Third', code: 'THIRD' }])).toEqual([
			{ message: 'First', recoverable: false },
			{ message: 'Second', recoverable: false },
			{ message: 'Third', code: 'THIRD', recoverable: false },
		]);
	});

	test('keeps native error codes', () => {
		expect(normalizeMcpErrors(Object.assign(new Error('Duplicate'), { code: 'ER_DUP_ENTRY' }))).toEqual([
			{ message: 'Duplicate', code: 'ER_DUP_ENTRY', recoverable: false },
		]);
	});

	test('omits a code that is not set', () => {
		expect(normalizeMcpErrors({ message: 'No code', code: undefined })).toEqual([
			{ message: 'No code', recoverable: false },
		]);
	});

	test.each([[123], [null], [undefined], [[]], [{}]])('falls back to a generic message for %j', (error) => {
		expect(normalizeMcpErrors(error)).toEqual([{ message: 'An unknown error occurred.', recoverable: false }]);
	});
});
