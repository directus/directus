import { Filter, LogicalFilterOR, LogicalFilterAND } from '../types/filter';

export function mergeFilters(
	filterA: Filter | null,
	filterB: Filter | null,
	strategy: 'and' | 'or' = 'and'
): Filter | null {
	if (!filterA) return filterB;
	if (!filterB) return filterA;

	return {
		[`_${strategy}`]: [filterA, filterB],
	} as LogicalFilterAND | LogicalFilterOR;
}
