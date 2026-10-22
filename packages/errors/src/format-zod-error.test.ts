import { expect, test } from 'vitest';
import { type core, z, ZodError } from 'zod';
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

test('Lists the issues of every union branch', () => {
	const result = z
		.object({ auth: z.union([z.object({ email: z.string() }), z.object({ access_token: z.string() })]) })
		.safeParse({ auth: {} });

	if (result.success) throw new Error('Expected invalid input');

	expect(formatZodError(result.error)).toBe(
		'Invalid input: expected string, received undefined at "auth.email" or Invalid input: expected string, received undefined at "auth.access_token"',
	);
});

test('Groups union branches with multiple issues', () => {
	const result = z
		.union([z.object({ email: z.string(), password: z.string() }), z.object({ access_token: z.string() })])
		.safeParse({});

	if (result.success) throw new Error('Expected invalid input');

	expect(formatZodError(result.error)).toBe(
		'(Invalid input: expected string, received undefined at "email"; Invalid input: expected string, received undefined at "password") or Invalid input: expected string, received undefined at "access_token"',
	);
});

test('Formats numeric and non-ASCII path segments', () => {
	const array = z.array(z.string()).safeParse([1]);
	const object = z.object({ größe: z.string() }).safeParse({});

	if (array.success || object.success) throw new Error('Expected invalid input');

	expect(formatZodError(array.error)).toBe('Invalid input: expected string, received number at "[0]"');
	expect(formatZodError(object.error)).toBe('Invalid input: expected string, received undefined at "größe"');
});

test('Limits the number of listed issues', () => {
	const result = z.array(z.string()).safeParse(Array.from({ length: 150 }, () => 0));

	if (result.success) throw new Error('Expected invalid input');

	const formatted = formatZodError(result.error);

	expect(formatted.split('; ')).toHaveLength(100);
	expect(formatted).toContain('at "[98]"');
	expect(formatted).not.toContain('at "[99]"');
	expect(formatted.endsWith('; and 51 more issues')).toBe(true);
});

test('Falls back to a generic message without issues', () => {
	expect(formatZodError(new ZodError([]))).toBe('Invalid input');
});

test('Handles issues without a path', () => {
	const error = new ZodError([{ code: 'custom', message: 'Custom issue' } as core.$ZodIssue]);

	expect(formatZodError(error)).toBe('Custom issue');
});
