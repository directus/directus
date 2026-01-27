import { expect, test } from 'vitest';
import { applyFunctionToColumnName } from './apply-function-to-column-name.js';

test.each([
	{ input: 'test', expected: 'test' },
	{ input: 'year(date_created)', expected: 'date_created_year' },
	{ input: `hour(timestamp)`, expected: 'timestamp_hour' },
	{ input: `count(value)`, expected: 'value_count' },
	{ input: 'json(metadata.color)', expected: 'metadata_color_json' },
	{ input: 'json(data.items[0].name)', expected: 'data_items_0_name_json' },
	{ input: 'json(users[0])', expected: 'users_0_json' },
])('should return "$expected" for "$input"', ({ input, expected }) => {
	expect(applyFunctionToColumnName(input)).toBe(expected);
});
