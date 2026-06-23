import { describe, expect, test } from 'vitest';
import { stripFieldArrayIndex } from './strip-field-array-index.js';

describe('stripFieldArrayIndex', () => {
	test.each([
		// Array index access is only meaningful when rendering a value, not when selecting fields, so
		// it is stripped and the full relation is selected instead.
		{ input: 'locale[0].name', expected: 'locale.name' },
		{ input: 'locale.0.name', expected: 'locale.name' },
		{ input: 'translations[0]', expected: 'translations' },
		{ input: 'items[0].nested[1].value', expected: 'items.nested.value' },
		// Non-indexed paths are untouched.
		{ input: 'slug.navigation_items_id.url', expected: 'slug.navigation_items_id.url' },
		{ input: 'id', expected: 'id' },
		// Brackets inside function arguments (e.g. json paths) must be preserved.
		{ input: 'json(data,items[0])', expected: 'json(data,items[0])' },
		{ input: 'json(data,items[0].name)', expected: 'json(data,items[0].name)' },
		{ input: 'category_id.json(metadata, color)', expected: 'category_id.json(metadata, color)' },
	])('normalizes "$input" to "$expected"', ({ input, expected }) => {
		expect(stripFieldArrayIndex(input)).toBe(expected);
	});
});
