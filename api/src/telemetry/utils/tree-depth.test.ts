import { describe, expect, test } from 'vitest';
import { computeDepthDistribution } from './tree-depth.js';

describe('computeDepthDistribution', () => {
	test('returns empty distribution for no items', () => {
		expect(computeDepthDistribution([])).toEqual({ min: 0, max: 0, median: 0, mean: 0 });
	});

	test('returns all zeros for flat structure (no children)', () => {
		const items = [
			{ id: 'a', parent: null },
			{ id: 'b', parent: null },
			{ id: 'c', parent: null },
		];

		expect(computeDepthDistribution(items)).toEqual({ min: 0, max: 0, median: 0, mean: 0 });
	});

	test('returns depth 1 for single-level nesting', () => {
		const items = [
			{ id: 'a', parent: null },
			{ id: 'b', parent: 'a' },
			{ id: 'c', parent: 'a' },
		];

		const result = computeDepthDistribution(items);
		expect(result).toEqual({ min: 1, max: 1, median: 1, mean: 1 });
	});

	test('returns correct depths for deep chain', () => {
		const items = [
			{ id: 'a', parent: null },
			{ id: 'b', parent: 'a' },
			{ id: 'c', parent: 'b' },
			{ id: 'd', parent: 'c' },
		];

		const result = computeDepthDistribution(items);
		// Single top-level root with depth 3
		expect(result).toEqual({ min: 3, max: 3, median: 3, mean: 3 });
	});

	test('returns distribution across multiple roots with different depths', () => {
		const items = [
			// Tree 1: depth 2
			{ id: 'a', parent: null },
			{ id: 'b', parent: 'a' },
			{ id: 'c', parent: 'b' },
			// Tree 2: depth 0 (no children)
			{ id: 'd', parent: null },
			// Tree 3: depth 1
			{ id: 'e', parent: null },
			{ id: 'f', parent: 'e' },
		];

		const result = computeDepthDistribution(items);
		// Depths: [2, 0, 1] → sorted: [0, 1, 2]
		expect(result).toEqual({ min: 0, max: 2, median: 1, mean: 1 });
	});

	test('handles single root with no children', () => {
		const items = [{ id: 'a', parent: null }];

		expect(computeDepthDistribution(items)).toEqual({ min: 0, max: 0, median: 0, mean: 0 });
	});

	test('takes max depth when tree branches', () => {
		const items = [
			{ id: 'root', parent: null },
			// Branch 1: depth 1
			{ id: 'child1', parent: 'root' },
			// Branch 2: depth 2
			{ id: 'child2', parent: 'root' },
			{ id: 'grandchild', parent: 'child2' },
		];

		const result = computeDepthDistribution(items);
		// Single root, max depth is 2 (through child2 → grandchild)
		expect(result).toEqual({ min: 2, max: 2, median: 2, mean: 2 });
	});
});
