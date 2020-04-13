import { Filter } from '@/stores/collection-presets/types';

export default function filtersToQuery(filters: readonly Filter[]) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const query: Record<string, any> = {};

	filters.forEach((filter) => {
		query[`filter[${filter.field}][${filter.operator}]`] = filter.value;
	});

	return query;
}
