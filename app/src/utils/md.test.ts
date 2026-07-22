// @vitest-environment jsdom
import { expect, test } from 'vitest';
import { md } from './md.js';

test.each([
	{ value: 'test', expected: '<p>test</p>\n' },
	{
		value: `[Directus](https://example.directus.com)`,
		expected: '<p><a target="_self" href="https://example.directus.com">Directus</a></p>\n',
	},
	{
		value: `[Directus](https://example.directus.com)`,
		expected: '<p><a target="_blank" href="https://example.directus.com" rel="noopener noreferrer">Directus</a></p>\n',
		options: { target: '_blank' } as const,
	},
	{ value: `test<script>alert('alert')</script>`, expected: '<p>test</p>\n' },
])('should sanitize "$str" into "$expected"', ({ value, expected, options }) => {
	expect(md(value, options)).toBe(expected);
});
