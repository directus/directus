// @vitest-environment jsdom
import { md } from './md.js';
import { expect, test } from 'vitest';

test.each([
	{ value: 'test', expected: '<p>test</p>\n' },
	{
		value: `[Directus](https://directus.io)`,
		expected: '<p><a target="_self" href="https://directus.io">Directus</a></p>\n',
	},
	{
		value: `[Directus](https://directus.io)`,
		expected: '<p><a target="_blank" href="https://directus.io" rel="noopener noreferrer">Directus</a></p>\n',
		options: { target: '_blank' } as const,
	},
	{ value: `test<script>alert('alert')</script>`, expected: '<p>test</p>\n' },
])('should sanitize "$str" into "$expected"', ({ value, expected, options }) => {
	expect(md(value, options)).toBe(expected);
});
