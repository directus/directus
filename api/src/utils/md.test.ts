import { expect, test } from 'vitest';
import { md } from './md.js';

test.each([
	{ value: 'test', expected: '<p>test</p>\n' },
	{ value: `<a href="/test" download />`, expected: '<a href="/test"></a>' },
	{ value: `test<script>alert('alert')</script>`, expected: '<p>test</p>\n' },
])('should sanitize "$str" into "$expected"', ({ value, expected }) => {
	expect(md(value)).toBe(expected);
});
