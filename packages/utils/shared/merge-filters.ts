import type { Filter, LogicalFilterAND, LogicalFilterOR } from '@directus/types';

type Strategy = 'and' | 'or';

/**
 * Combine filters with `_and` (default) or `_or`, skipping empty (`null`/`undefined`) ones.
 * Returns `null` when no filter is left, or the filter itself when only one is left.
 */
export function mergeFilters(filters: (Filter | null | undefined)[], strategy?: Strategy): Filter | null;
export function mergeFilters(filterA: Filter | null, filterB: Filter | null, strategy?: Strategy): Filter | null;
export function mergeFilters(
	filtersOrA: (Filter | null | undefined)[] | Filter | null,
	filterBOrStrategy?: Filter | Strategy | null,
	strategy: Strategy = 'and',
): Filter | null {
	let filters: (Filter | null | undefined)[];

	if (Array.isArray(filtersOrA)) {
		filters = filtersOrA;
		strategy = (filterBOrStrategy as Strategy | undefined) ?? 'and';
	} else {
		filters = [filtersOrA, filterBOrStrategy as Filter | null];
	}

	const present = filters.filter((filter): filter is Filter => !!filter);

	if (present.length === 0) return null;
	if (present.length === 1) return present[0]!;

	return { [`_${strategy}`]: present } as LogicalFilterAND | LogicalFilterOR;
}
