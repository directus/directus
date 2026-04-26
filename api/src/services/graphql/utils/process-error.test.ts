import { createError } from '@directus/errors';
import type { Accountability } from '@directus/types';
import { GraphQLError } from 'graphql';
import { describe, expect, test } from 'vitest';
import processError from './process-error.js';

describe('GraphQL processError util', () => {
	const sampleError = new GraphQLError('An error message', { path: ['test_collection'] });

	const validationError = {
		message: 'An error message',
		extensions: {
			code: 'GRAPHQL_VALIDATION_FAILED',
		},
		path: ['test_collection'],
	};

	test('returns redacted error when unauthenticated', () => {
		expect(processError(null, sampleError)).toEqual(validationError);
	});

	test('returns redacted error when authenticated but not an admin', () => {
		expect(processError({ role: 'd674e22b-f405-48ba-9958-9a7bd16a1aa9' } as Accountability, sampleError)).toEqual(
			validationError,
		);
	});

	test('returns original error when authenticated and is an admin', () => {
		expect(
			processError({ role: 'd674e22b-f405-48ba-9958-9a7bd16a1aa9', admin: true } as Accountability, sampleError),
		).toEqual(validationError);
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
