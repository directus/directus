import { describe, expect, test } from 'vitest';
import { flattenGroupedItems } from './flatten-grouped-items';

interface TestItem {
	id: string;
	name: string;
	group: string | null;
	sort: number | null;
}

const config = {
	getId: (item: TestItem) => item.id,
	getParent: (item: TestItem) => item.group,
	getSort: (item: TestItem) => item.sort,
	getName: (item: TestItem) => item.name,
};

describe('flattenGroupedItems', () => {
	test('returns empty array for empty input', () => {
		const result = flattenGroupedItems<TestItem>([], config);
		expect(result).toEqual([]);
	});

	test('returns items sorted by sort value for flat list', () => {
		const items: TestItem[] = [
			{ id: 'c', name: 'C', group: null, sort: 3 },
			{ id: 'a', name: 'A', group: null, sort: 1 },
			{ id: 'b', name: 'B', group: null, sort: 2 },
		];

		const result = flattenGroupedItems(items, config);

		expect(result.map((i) => i.id)).toEqual(['a', 'b', 'c']);
	});

	test('falls back to name sorting when sort is null', () => {
		const items: TestItem[] = [
			{ id: 'c', name: 'Zebra', group: null, sort: null },
			{ id: 'a', name: 'Alpha', group: null, sort: null },
			{ id: 'b', name: 'Beta', group: null, sort: null },
		];

		const result = flattenGroupedItems(items, config);

		expect(result.map((i) => i.id)).toEqual(['a', 'b', 'c']);
	});

	test('sorts by sort value first, then by name', () => {
		const items: TestItem[] = [
			{ id: 'a', name: 'Zebra', group: null, sort: 1 },
			{ id: 'b', name: 'Alpha', group: null, sort: 1 },
			{ id: 'c', name: 'Beta', group: null, sort: 2 },
		];

		const result = flattenGroupedItems(items, config);

		// Same sort value -> alphabetical by name
		expect(result.map((i) => i.id)).toEqual(['b', 'a', 'c']);
	});

	test('places children under their parent', () => {
		const items: TestItem[] = [
			{ id: 'parent', name: 'Parent', group: null, sort: 1 },
			{ id: 'child1', name: 'Child 1', group: 'parent', sort: 1 },
			{ id: 'child2', name: 'Child 2', group: 'parent', sort: 2 },
		];

		const result = flattenGroupedItems(items, config);

		expect(result.map((i) => i.id)).toEqual(['parent', 'child1', 'child2']);
	});

	test('handles nested hierarchy (grandchildren)', () => {
		const items: TestItem[] = [
			{ id: 'root', name: 'Root', group: null, sort: 1 },
			{ id: 'child', name: 'Child', group: 'root', sort: 1 },
			{ id: 'grandchild', name: 'Grandchild', group: 'child', sort: 1 },
		];

		const result = flattenGroupedItems(items, config);

		expect(result.map((i) => i.id)).toEqual(['root', 'child', 'grandchild']);
	});

	test('handles multiple root items with nested children', () => {
		const items: TestItem[] = [
			{ id: 'root2', name: 'Root 2', group: null, sort: 2 },
			{ id: 'root1', name: 'Root 1', group: null, sort: 1 },
			{ id: 'child1a', name: 'Child 1A', group: 'root1', sort: 1 },
			{ id: 'child2a', name: 'Child 2A', group: 'root2', sort: 1 },
		];

		const result = flattenGroupedItems(items, config);

		expect(result.map((i) => i.id)).toEqual(['root1', 'child1a', 'root2', 'child2a']);
	});

	test('handles items with undefined parent as root items', () => {
		const configWithUndefined = {
			getId: (item: { id: string; group?: string }) => item.id,
			getParent: (item: { id: string; group?: string }) => item.group ?? null,
			getSort: () => null,
			getName: (item: { id: string; name: string }) => item.name,
		};

		const items = [
			{ id: 'a', name: 'A', group: undefined },
			{ id: 'b', name: 'B' }, // no group property at all
		];

		const result = flattenGroupedItems(items, configWithUndefined);

		expect(result.map((i) => i.id)).toEqual(['a', 'b']);
	});

	test('sorts children independently within each parent', () => {
		const items: TestItem[] = [
			{ id: 'parent1', name: 'Parent 1', group: null, sort: 1 },
			{ id: 'parent2', name: 'Parent 2', group: null, sort: 2 },
			{ id: 'child1b', name: 'Child B', group: 'parent1', sort: 2 },
			{ id: 'child1a', name: 'Child A', group: 'parent1', sort: 1 },
			{ id: 'child2b', name: 'Child B', group: 'parent2', sort: 2 },
			{ id: 'child2a', name: 'Child A', group: 'parent2', sort: 1 },
		];

		const result = flattenGroupedItems(items, config);

		expect(result.map((i) => i.id)).toEqual(['parent1', 'child1a', 'child1b', 'parent2', 'child2a', 'child2b']);
	});

	test('handles orphan items (parent does not exist)', () => {
		const items: TestItem[] = [
			{ id: 'orphan', name: 'Orphan', group: 'nonexistent', sort: 1 },
			{ id: 'root', name: 'Root', group: null, sort: 1 },
		];

		const result = flattenGroupedItems(items, config);

		// Orphan is not included since its parent doesn't exist
		expect(result.map((i) => i.id)).toEqual(['root']);
	});
});
