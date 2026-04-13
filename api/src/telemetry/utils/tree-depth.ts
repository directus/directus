import type { DistributionSummary } from '../types/report.js';
import { distributionFromCounts, emptyDistribution } from './stats.js';

/**
 * Computes a distribution of max tree depths for each top-level node.
 * Expects items with `id` and `parent` (null for root nodes).
 */
export function computeDepthDistribution(
	items: Array<{ id: string; parent: string | null }>,
): DistributionSummary {
	if (items.length === 0) return emptyDistribution();

	const childrenMap = new Map<string | null, string[]>();

	for (const item of items) {
		const siblings = childrenMap.get(item.parent) ?? [];
		siblings.push(item.id);
		childrenMap.set(item.parent, siblings);
	}

	const topLevel = childrenMap.get(null) ?? [];

	function maxDepth(id: string): number {
		const children = childrenMap.get(id);
		if (!children || children.length === 0) return 0;
		return 1 + Math.max(...children.map(maxDepth));
	}

	return distributionFromCounts(topLevel.map(maxDepth));
}
