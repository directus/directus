import { Filter } from '@/types/';

export function filtersToQuery(filters: readonly Filter[]) {
	const query: Record<string, any> = {};

	filters.forEach((filter) => {
		query[`filter[${filter.field}][_${filter.operator}]`] = filter.value;
	});

	return query;
}
