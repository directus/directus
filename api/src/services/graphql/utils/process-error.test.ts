import { GraphQLError } from 'graphql';
import { describe, expect, test } from 'vitest';
import processError from './process-error';

describe('GraphQL processError util', () => {
	const sampleError = new GraphQLError('An error message', { path: ['test_collection'] });
	const redactedError = {
		message: 'An unexpected error occurred.',
		extensions: {
			code: 'INTERNAL_SERVER_ERROR',
		},
	};

	test('returns redacted error when unauthenticated', () => {
		expect(processError(null, sampleError)).toEqual(expect.objectContaining(redactedError));
	});

	test('returns redacted error when authenticated but not an admin', () => {
		expect(processError({ role: 'd674e22b-f405-48ba-9958-9a7bd16a1aa9' }, sampleError)).toEqual(
			expect.objectContaining(redactedError)
		);
	});

	test('returns original error when authenticated and is an admin', () => {
		expect(processError({ role: 'd674e22b-f405-48ba-9958-9a7bd16a1aa9', admin: true }, sampleError)).toEqual(
			expect.objectContaining({
				...sampleError,
				extensions: {
					code: 'INTERNAL_SERVER_ERROR',
				},
			})
		);
	});
});
