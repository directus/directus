import type { DistributionSummary } from '../types/report.js';

/**
 * Returns a zeroed-out distribution summary.
 */
export function emptyDistribution(): DistributionSummary {
	return { min: 0, max: 0, median: 0, mean: 0 };
}

/**
 * Compute a DistributionSummary (min, max, median, mean) from an array of
 * numeric values. Returns all zeros for an empty array.
 */
export function distributionFromCounts(counts: number[]): DistributionSummary {
	if (counts.length === 0) return emptyDistribution();

	const sorted = [...counts].sort((a, b) => a - b);
	const min = sorted[0] ?? 0;
	const max = sorted[sorted.length - 1] ?? 0;
	const mean = Math.round(sorted.reduce((sum, value) => sum + value, 0) / sorted.length);
	const mid = Math.floor(sorted.length / 2);
	const median = sorted.length % 2 === 1 ? sorted[mid]! : Math.round((sorted[mid - 1]! + sorted[mid]!) / 2);

	return { min, max, median, mean };
}
