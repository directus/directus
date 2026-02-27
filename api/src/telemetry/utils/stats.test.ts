import { describe, expect, test } from 'vitest';
import { distributionFromCounts, emptyDistribution } from './stats.js';

describe('emptyDistribution', () => {
	test('returns zeroed distribution', () => {
		expect(emptyDistribution()).toEqual({ min: 0, max: 0, median: 0, mean: 0 });
	});
});

describe('distributionFromCounts', () => {
	test('returns empty distribution for empty array', () => {
		expect(distributionFromCounts([])).toEqual({ min: 0, max: 0, median: 0, mean: 0 });
	});

	test('handles single element', () => {
		expect(distributionFromCounts([42])).toEqual({ min: 42, max: 42, median: 42, mean: 42 });
	});

	test('computes correct min, max, mean, median for odd-length array', () => {
		const result = distributionFromCounts([1, 5, 3]);
		expect(result.min).toBe(1);
		expect(result.max).toBe(5);
		expect(result.median).toBe(3);
		expect(result.mean).toBe(3);
	});

	test('computes interpolated median for even-length array', () => {
		const result = distributionFromCounts([1, 2, 3, 4]);
		expect(result.min).toBe(1);
		expect(result.max).toBe(4);
		expect(result.median).toBe(3); // p50 interpolation: idx=1.5 → round((2*0.5 + 3*0.5)) = 3
		expect(result.mean).toBe(3); // round(10/4) = 3
	});

	test('handles all zeros', () => {
		expect(distributionFromCounts([0, 0, 0])).toEqual({ min: 0, max: 0, median: 0, mean: 0 });
	});

	test('handles unsorted input', () => {
		const result = distributionFromCounts([100, 1, 50]);
		expect(result.min).toBe(1);
		expect(result.max).toBe(100);
	});
});
