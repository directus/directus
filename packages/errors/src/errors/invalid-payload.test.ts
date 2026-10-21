import { beforeEach, expect, test } from 'vitest';
import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { ErrorCode } from '../codes.js';
import { isDirectusError } from '../is-directus-error.js';
import type { InvalidPayloadErrorExtensions } from './invalid-payload.js';
import { InvalidPayloadError, messageConstructor } from './invalid-payload.js';

let sample: InvalidPayloadErrorExtensions;

beforeEach(() => {
	sample = {
		reason: 'Test payload validation failed',
	};
});

test('Constructs message', () => {
	expect(messageConstructor(sample)).toBe(`Invalid payload. ${sample.reason}.`);
});

test('Accepts a Zod error', () => {
	const result = z.string().safeParse(42);

	if (result.success) throw new Error('Expected invalid input');

	const error = new InvalidPayloadError(result.error);

	expect(error.extensions).toEqual({ reason: fromZodError(result.error).message });
	expect(error.status).toBe(400);
	expect(isDirectusError(error, ErrorCode.InvalidPayload)).toBe(true);
});
