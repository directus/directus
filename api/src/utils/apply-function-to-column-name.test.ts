import { expect, test } from 'vitest';

import { applyFunctionToColumnName } from './apply-function-to-column-name.js';

test.each([
	{ input: 'test', expected: 'test' },
	{ input: 'year(date_created)', expected: 'date_created_year' },
	{ input: `hour(timestamp)`, expected: 'timestamp_hour' },
	{ input: `count(value)`, expected: 'value_count' },
])('should return "$expected" for "$input"', ({ input, expected }) => {
	expect(applyFunctionToColumnName(input)).toBe(expected);
});
