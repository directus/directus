import { Filter } from '@directus/shared/types';
import { isEmpty, isNil } from 'lodash';

export function getFieldsFromFilter(filter: Filter): string[] {
	const fields: string[] = [];

	if (isNil(filter) || isEmpty(filter)) return fields;

	if ('_and' in filter || '_or' in filter) {
		Object.values(filter)[0].forEach((f: Filter) => {
			fields.push(...getFieldsFromFilter(f));
		});
	} else {
		let field = Object.keys(filter)[0];
		let subFilter = filter[field] as Record<string, any>;

		while (!Object.keys(subFilter)[0].startsWith('_')) {
			const newField = Object.keys(subFilter)[0];
			field += `.${newField}`;
			subFilter = subFilter[newField];
		}

		fields.push(field);
	}

	return fields;
}
