import { Filter } from '@/types/';
import { set, clone } from 'lodash';

export default function filtersToQuery(filters: readonly Filter[]) {
	const filterQuery: Record<string, any> = {};

	for (const filter of filters) {
		let { field, operator, value } = clone(filter) as any;

		if (['empty', 'nempty', 'null', 'nnull'].includes(operator)) {
			value = true;
		}

		if (!value) continue;

		set(filterQuery, field, { [`_${operator}`]: value });
	}

	return { filter: filterQuery };
}
