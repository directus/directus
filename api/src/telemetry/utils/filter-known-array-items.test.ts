import { describe, expect, test } from 'vitest';
import { filterKnownArrayItems } from './filter-known-array-items.js';

describe('filterKnownArrayItems', () => {
	const known = new Set(['gpt-5', 'gpt-5-mini', 'gpt-5-nano']);

	test('returns array of items that exist in the known set', () => {
		expect(filterKnownArrayItems(['gpt-5', 'gpt-5-mini', 'custom-model'], known)).toEqual(['gpt-5', 'gpt-5-mini']);
	});

	test('returns empty array when allowed is not an array', () => {
		expect(filterKnownArrayItems(null, known)).toEqual([]);
		expect(filterKnownArrayItems(undefined, known)).toEqual([]);
		expect(filterKnownArrayItems('gpt-5', known)).toEqual([]);
	});

	test('returns empty array when no items match', () => {
		expect(filterKnownArrayItems(['unknown-model'], known)).toEqual([]);
	});

	test('returns all items when all are known', () => {
		expect(filterKnownArrayItems(['gpt-5', 'gpt-5-mini', 'gpt-5-nano'], known)).toEqual(['gpt-5', 'gpt-5-mini', 'gpt-5-nano']);
	});

	test('returns empty array for empty array', () => {
		expect(filterKnownArrayItems([], known)).toEqual([]);
	});
});
