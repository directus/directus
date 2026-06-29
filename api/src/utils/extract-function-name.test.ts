import { describe, expect, test } from 'vitest';
import { extractFunctionName } from './extract-function-name.js';

describe('extractFunctionName', () => {
	const cases: [input: string, expected: string | null][] = [
		['title', null],
		['category_id.metadata', null],
		['json(metadata', null],
		['', null],
		['json(metadata, color)', 'json'],
		['year(date_created)', 'year'],
		['count(links)', 'count'],
		['  json(metadata, color)  ', 'json'],
	];

	test.each(cases)('extractFunctionName(%s) → %s', (input, expected) => {
		expect(extractFunctionName(input)).toBe(expected);
	});
});
