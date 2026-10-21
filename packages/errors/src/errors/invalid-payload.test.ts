import { beforeEach, expect, expectTypeOf, test } from 'vitest';
import { z } from 'zod';
import * as zMini from 'zod/mini';
import { fromZodError } from 'zod-validation-error';
import { ErrorCode } from '../codes.js';
import type { DirectusError, DirectusErrorConstructor } from '../create-error.js';
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

test('Preserves existing extensions and error options', () => {
	const cause = new Error('Original error');
	const error = new InvalidPayloadError(sample, { cause });

	expect(error.extensions).toBe(sample);
	expect(error.cause).toBe(cause);
	expect(error.message).toBe(`Invalid payload. ${sample.reason}.`);
	expect(error.name).toBe('DirectusError');
	expect(error.code).toBe(ErrorCode.InvalidPayload);
	expect(error.status).toBe(400);
	expect(isDirectusError(error, ErrorCode.InvalidPayload)).toBe(true);
	expectTypeOf(InvalidPayloadError).toExtend<DirectusErrorConstructor<InvalidPayloadErrorExtensions>>();
});

test('Accepts a Zod error and formats nested validation issues', () => {
	const result = z
		.object({
			profile: z.object({ name: z.string() }),
			tags: z.array(z.string()),
		})
		.safeParse({ profile: { name: 42 }, tags: ['valid', false] });

	if (result.success) throw new Error('Expected invalid input');

	const error = new InvalidPayloadError(result.error);
	const reason = fromZodError(result.error).message;

	expect(error.extensions).toEqual({ reason });
	expect(reason).toContain('profile.name');
	expect(reason).toContain('tags[1]');
	expect(error.message).toBe(`Invalid payload. ${reason}.`);
	expect(error.name).toBe('DirectusError');
	expect(error.code).toBe(ErrorCode.InvalidPayload);
	expect(error.status).toBe(400);
	expect(isDirectusError(error, ErrorCode.InvalidPayload)).toBe(true);
	expectTypeOf(error.extensions).toEqualTypeOf<InvalidPayloadErrorExtensions>();
	expectTypeOf(error).toExtend<DirectusError<InvalidPayloadErrorExtensions>>();
});

test('Preserves explicit error options when constructed from a Zod error', () => {
	const result = z.string().safeParse(42);

	if (result.success) throw new Error('Expected invalid input');

	const cause = new Error('Custom cause');
	const error = new InvalidPayloadError(result.error, { cause });

	expect(error.cause).toBe(cause);
	expect(error.extensions).toEqual({ reason: fromZodError(result.error).message });
});

test('Supports Zod Mini errors', () => {
	const result = zMini.safeParse(zMini.string(), 42);

	if (result.success) throw new Error('Expected invalid input');

	const error = new InvalidPayloadError(result.error);

	expect(error.extensions).toEqual({ reason: fromZodError(result.error).message });
	expect(error.message).toBe(`Invalid payload. ${error.extensions.reason}.`);
});
