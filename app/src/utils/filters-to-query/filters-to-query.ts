import { Filter } from '@/types/';
import { set } from 'lodash';

export default function filtersToQuery(filters: readonly Filter[]) {
	const filterQuery: Record<string, any> = {};

	for (const filter of filters) {
		const { field, operator, value } = filter;

		set(filterQuery, field, { [`_${operator}`]: value });
	}

	return { filter: filterQuery };
}
