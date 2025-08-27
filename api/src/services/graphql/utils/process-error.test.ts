import { GraphQLError } from 'graphql';
import { describe, expect, test } from 'vitest';
import processError from './process-error.js';
import { createError } from '@directus/errors';

describe('GraphQL processError util', () => {
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
