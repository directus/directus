import { expect, expectTypeOf, test } from 'vitest';
import { z } from 'zod';
import { createError, type DirectusError, type DirectusErrorConstructor } from './create-error.js';
import { formatZodError } from './format-zod-error.js';
import { withZodSupport } from './with-zod-support.js';

interface Extensions {
	reason: string;
}

const TestError = withZodSupport(createError<Extensions>('TEST', ({ reason }) => `Test. ${reason}.`, 400));

const invalidInput = { profile: { name: 42 }, tags: ['valid', false] };

test('Preserves existing extensions and error options', () => {
	const cause = new Error('Original error');
	const error = new TestError({ reason: 'Something went wrong' }, { cause });

	expect(error.extensions).toEqual({ reason: 'Something went wrong' });
	expect(error.cause).toBe(cause);
	expect(error.message).toBe('Test. Something went wrong.');
	expect(error.name).toBe('DirectusError');
	expect(error.code).toBe('TEST');
	expect(error.status).toBe(400);
	expectTypeOf(TestError).toExtend<DirectusErrorConstructor<Extensions>>();
});

test('Formats a Zod error into the reason and keeps it as cause', () => {
	const result = z
		.object({ profile: z.object({ name: z.string() }), tags: z.array(z.string()) })
		.safeParse(invalidInput);

	if (result.success) throw new Error('Expected invalid input');

	const error = new TestError(result.error);
	const reason = formatZodError(result.error);

	expect(error.extensions).toEqual({ reason });
	expect(reason).toContain('profile.name');
	expect(reason).toContain('tags[1]');
	expect(error.message).toBe(`Test. ${reason}.`);
	expect(error.cause).toBe(result.error);
	expectTypeOf(error).toExtend<DirectusError<Extensions>>();
});

test('Prefers an explicitly passed cause over the Zod error', () => {
	const result = z.string().safeParse(42);

	if (result.success) throw new Error('Expected invalid input');

	const cause = new Error('Custom cause');
	const error = new TestError(result.error, { cause });

	expect(error.cause).toBe(cause);
	expect(error.extensions).toEqual({ reason: formatZodError(result.error) });
});

test('Treats plain objects shaped like a Zod error as extensions', () => {
	const extensions = { name: 'ZodError', issues: [], reason: 'Forwarded reason' };
	const error = new TestError(extensions);

	expect(error.extensions).toBe(extensions);
	expect(error.message).toBe('Test. Forwarded reason.');
});
