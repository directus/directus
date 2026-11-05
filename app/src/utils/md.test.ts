// @vitest-environment jsdom
import dompurify from 'dompurify';
import { expect, test, vi } from 'vitest';
import { md } from './md.js';

test.each([
	{ value: 'test', expected: '<p>test</p>\n' },
	{
		value: `[Directus](https://directus.example.com)`,
		expected: '<p><a target="_self" href="https://directus.example.com">Directus</a></p>\n',
	},
	{
		value: `[Directus](https://directus.example.com)`,
		expected: '<p><a target="_blank" href="https://directus.example.com" rel="noopener noreferrer">Directus</a></p>\n',
		options: { target: '_blank' } as const,
	},
	{ value: `test<script>alert('alert')</script>`, expected: '<p>test</p>\n' },
])('should sanitize "$str" into "$expected"', ({ value, expected, options }) => {
	expect(md(value, options)).toBe(expected);
});

test('does not register a DOMPurify hook per call', () => {
	const addHook = vi.spyOn(dompurify, 'addHook');

	md('one');
	md('two');

	expect(addHook).not.toHaveBeenCalled();
});
