import { GraphQLError } from 'graphql';
import { describe, expect, test } from 'vitest';
import processError from './process-error.js';
import { createError } from '@directus/errors';

describe('GraphQL processError util', () => {
	const sampleError = new GraphQLError('An error message', { path: ['test_collection'] });

	const redactedError = {
		message: 'An unexpected error occurred.',
		locations: undefined,
		extensions: {
			code: 'INTERNAL_SERVER_ERROR',
		},
	};

	test('returns redacted error when unauthenticated', () => {
		expect(processError(null, sampleError)).toEqual(redactedError);
	});

	test('returns redacted error when authenticated but not an admin', () => {
		expect(processError({ role: 'd674e22b-f405-48ba-9958-9a7bd16a1aa9' }, sampleError)).toEqual(redactedError);
	});

	test('returns original error when authenticated and is an admin', () => {
		expect(processError({ role: 'd674e22b-f405-48ba-9958-9a7bd16a1aa9', admin: true }, sampleError)).toEqual({
			message: 'An error message',
			path: ['test_collection'],
			extensions: {
				code: 'INTERNAL_SERVER_ERROR',
			},
		});
	});

	test('returns original error when createError is used to create the error', () => {
		const InvalidPayloadError = createError('INVALID_PAYLOAD_ERROR', 'Something went wrong...', 400);

		const sampleError = new GraphQLError('An error message', {
			path: ['test_collection'],
			originalError: new InvalidPayloadError(),
		});

		expect(processError(null, sampleError)).toEqual({
			message: 'Something went wrong...',
			extensions: {
				code: 'INVALID_PAYLOAD_ERROR',
			},
			path: ['test_collection'],
		});
	});
});
