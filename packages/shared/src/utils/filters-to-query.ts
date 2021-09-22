import { Filter } from '../types';
import { clone } from 'lodash';

export function filtersToQuery(filters: readonly Filter[]): { filter: Record<string, any> } {
	const filterList: Record<string, any>[] = [];

	for (const filter of filters) {
		const { field, operator } = clone(filter) as any;
		let { value } = clone(filter) as any;

		if (['empty', 'nempty', 'null', 'nnull'].includes(operator)) {
			value = true;
		}

		if (value === undefined) continue;

		if (field.includes('.')) {
			let filter: Record<string, any> = { [`_${operator}`]: value };
			const path = field.split('.');

			for (const field of path.reverse()) {
				filter = { [field]: filter };
			}

			filterList.push(filter);
		} else {
			filterList.push({ [field]: { [`_${operator}`]: value } });
		}
	}

	let filterQuery: Record<string, any> = {};

	if (filterList.length === 1 && filterList[0] !== undefined) {
		filterQuery = filterList[0];
	} else if (filterList.length > 1) {
		filterQuery = { _and: filterList };
	}

	return { filter: filterQuery };
}
