import { describe, expect, test } from 'vitest';
import { convertToSQLitePath } from './sqlite-json-path.js';

const TEST_CASES = [
	{ input: '.color', expected: '$.color', description: 'property access' },
	{ input: '[0]', expected: '$[0]', description: 'root array index' },
	{ input: '.items[0].name', expected: '$.items[0].name', description: 'mixed nested access' },
	{ input: '.0', expected: '$.0', description: 'numeric object key' },
	{ input: '.author.', expected: '$.author', description: 'incomplete trailing dot' },
];

describe('convertToSQLitePath', () => {
	test.each(TEST_CASES)('converts "$input" to "$expected" ($description)', ({ input, expected }) => {
		expect(convertToSQLitePath(input)).toBe(expected);
	});
});
