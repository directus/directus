import { beforeEach, expect, test } from 'vitest';
import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { ErrorCode } from '../codes.js';
import { isDirectusError } from '../is-directus-error.js';
import type { InvalidQueryErrorExtensions } from './invalid-query.js';
import { InvalidQueryError, messageConstructor } from './invalid-query.js';

let sample: InvalidQueryErrorExtensions;

beforeEach(() => {
	sample = {
		reason: 'Test query validation failed',
	};
});

test('Constructs message', () => {
	expect(messageConstructor(sample)).toBe(`Invalid query. ${sample.reason}.`);
});

test('Accepts a Zod error', () => {
	const result = z.string().safeParse(42);

	if (result.success) throw new Error('Expected invalid input');

	const error = new InvalidQueryError(result.error);

	expect(error.extensions).toEqual({ reason: fromZodError(result.error).message });
	expect(error.status).toBe(400);
	expect(isDirectusError(error, ErrorCode.InvalidQuery)).toBe(true);
});
