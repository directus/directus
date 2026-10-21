import { expect, test } from 'vitest';
import { z } from 'zod';
import { formatZodError } from './format-zod-error.js';

test('Formats all issues with their path', () => {
	const result = z
		.object({ profile: z.object({ name: z.string() }), tags: z.array(z.string()) })
		.safeParse({ profile: { name: 42 }, tags: ['valid', false] });

	if (result.success) throw new Error('Expected invalid input');

	expect(formatZodError(result.error)).toBe(
		'Invalid input: expected string, received number at "profile.name"; Invalid input: expected string, received boolean at "tags[1]"',
	);
});

test('Quotes keys that are not valid identifiers', () => {
	const result = z.object({ 'first name': z.string() }).safeParse({});

	if (result.success) throw new Error('Expected invalid input');

	expect(formatZodError(result.error)).toBe('Invalid input: expected string, received undefined at "["first name"]"');
});

test('Omits the path for root level issues', () => {
	const result = z.string().safeParse(42);

	if (result.success) throw new Error('Expected invalid input');

	expect(formatZodError(result.error)).toBe('Invalid input: expected string, received number');
});
