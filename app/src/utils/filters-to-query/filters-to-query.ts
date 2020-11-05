import { Filter } from '@/types/';
import { clone } from 'lodash';

export default function filtersToQuery(filters: readonly Filter[]) {
	const filterList: Record<string, any>[] = [];

	for (const filter of filters) {
		let { field, operator, value } = clone(filter) as any;

		if (['empty', 'nempty', 'null', 'nnull'].includes(operator)) {
			value = true;
		}

		if (!value) continue;

		filterList.push({ [field]: { [`_${operator}`]: value } });
	}

	let filterQuery: Record<string, any> = {};

	if (filterList.length === 1) {
		filterQuery = filterList[0];
	} else if (filterList.length > 1) {
		filterQuery = { _and: filterList };
	}

	return { filter: filterQuery };
}
