import type { Query } from '../../types/index.js';

/**
 * Transform nested query object to an url compatible format
 *
 * @param query The nested query object
 *
 * @returns Flat query parameters
 */
export const queryToParams = <Schema extends object, Item>(query: Query<Schema, Item>): Record<string, string> => {
	const params: Record<string, string> = {};
	// TODO better type/value guarding

	if (query.fields) {
		type FieldItem = (typeof query.fields)[number];

		const walkFields = (value: FieldItem, chain: string[] = []): string | string[] => {
			if (typeof value === 'object') {
				const result = [];

				for (const key in value) {
					const fieldList = value[key as keyof typeof value] ?? [];

					for (const item of fieldList) {
						result.push(walkFields(item as FieldItem, [...chain, key]));
					}
				}

				return result.flatMap((items) => items);
			}

			return [...chain, String(value)].join('.');
		};

		params['fields'] = query.fields.flatMap((value) => walkFields(value)).join(',');
	}

	if (query.filter) {
		params['filter'] = JSON.stringify(query.filter);
	}

	if (query.search) {
		params['search'] = query.search;
	}

	if (query.sort) {
		params['sort'] = query.sort.join(',');
	}

	if (query.limit) {
		params['limit'] = String(query.limit);
	}

	if (query.offset) {
		params['offset'] = String(query.offset);
	}

	if (query.page) {
		params['offset'] = String(query.offset);
	}

	if (query.deep) {
		params['deep'] = JSON.stringify(query.deep);
	}

	if (query.alias) {
		params['alias'] = JSON.stringify(query.alias);
	}

	return params;
};
