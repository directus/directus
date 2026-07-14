import { describe, expect, test } from 'vitest';
import {
	buildJsonFilter,
	coerceJsonFilterValue,
	getJsonFilterParts,
	initialValueForComparator,
	isJsonFilter,
	JSON_FILTER_OPERATORS,
	JSON_VALUE_KEY,
} from './utils';

describe('JSON filter serialization', () => {
	test('detects only JSON filters supported by the visual row', () => {
		expect(isJsonFilter({ metadata: { _json: {} } })).toBe(true);
		expect(isJsonFilter({ metadata: { _json: { author: { _eq: 'jane' } } } })).toBe(true);
		expect(isJsonFilter({ metadata: { _eq: 'jane' } })).toBe(false);
		expect(isJsonFilter({ metadata: { _json: { author: { _eq: 'jane' }, rating: { _gte: 3 } } } })).toBe(false);
	});

	test('keeps dot and bracket notation as one literal path key', () => {
		expect(buildJsonFilter('metadata', 'data.tags[0]', '_eq', 'featured')).toEqual({
			metadata: { _json: { 'data.tags[0]': { _eq: 'featured' } } },
		});
	});

	test('splits a relational field path without splitting the JSON path', () => {
		expect(buildJsonFilter('category.metadata', 'settings.theme', '_eq', 'dark')).toEqual({
			category: { metadata: { _json: { 'settings.theme': { _eq: 'dark' } } } },
		});
	});

	test('uses an empty JSON block for an incomplete draft', () => {
		expect(buildJsonFilter('metadata', '', '_eq', null)).toEqual({
			metadata: { _json: {} },
		});
	});

	test('round trips a complete JSON condition', () => {
		const node = buildJsonFilter('metadata', 'rating', '_between', [3, 5]);

		expect(getJsonFilterParts(node)).toEqual({
			field: 'metadata',
			path: 'rating',
			operator: '_between',
			value: [3, 5],
			valueNode: { [JSON_VALUE_KEY]: { _between: [3, 5] } },
		});
	});

	test('returns editable defaults for an incomplete draft', () => {
		expect(getJsonFilterParts({ metadata: { _json: {} } })).toEqual({
			field: 'metadata',
			path: '',
			operator: '_eq',
			value: null,
			valueNode: { [JSON_VALUE_KEY]: { _eq: null } },
		});
	});

	test('exposes all scalar JSON operators and no specialized operators', () => {
		expect(JSON_FILTER_OPERATORS).toContain('istarts_with');
		expect(JSON_FILTER_OPERATORS).toContain('between');
		expect(JSON_FILTER_OPERATORS).not.toContain('json');
		expect(JSON_FILTER_OPERATORS).not.toContain('regex');
		expect(JSON_FILTER_OPERATORS).not.toContain('intersects');
	});
});

describe('JSON filter values', () => {
	test.each([
		['3', 3],
		['-2.5', -2.5],
		['true', true],
		['false', false],
		['null', null],
		['jane', 'jane'],
		['"3"', '3'],
	])('coerces %s to the expected JSON scalar', (input, expected) => {
		expect(coerceJsonFilterValue(input, '_eq')).toEqual(expected);
	});

	test('coerces array entries independently', () => {
		expect(coerceJsonFilterValue(['3', 'true', 'jane', '"3"'], '_in')).toEqual([3, true, 'jane', '3']);
	});

	test.each([
		'_contains',
		'_ncontains',
		'_icontains',
		'_starts_with',
		'_nstarts_with',
		'_istarts_with',
		'_nistarts_with',
		'_ends_with',
		'_nends_with',
		'_iends_with',
		'_niends_with',
	] as const)('preserves string values for %s', (operator) => {
		expect(coerceJsonFilterValue('42', operator)).toBe('42');
		expect(coerceJsonFilterValue('true', operator)).toBe('true');
	});

	test('creates the correct value shape when an operator changes', () => {
		expect(initialValueForComparator('_in', 'value')).toEqual(['value']);
		expect(initialValueForComparator('_between', [1, 2, 3])).toEqual([1, 2]);
		expect(initialValueForComparator('_null', 'value')).toBe(true);
		expect(initialValueForComparator('_eq', true, '_null')).toBeNull();
	});
});
