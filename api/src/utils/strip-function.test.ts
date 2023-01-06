import { expect, test } from 'vitest';

import { stripFunction } from './strip-function';

test.each([
	{ field: 'year(date_created)', expected: 'date_created' },
	{ field: 'test', expected: 'test' },
])('should return "$expected" for "$field"', ({ field, expected }) => {
	expect(stripFunction(field)).toBe(expected);
});
