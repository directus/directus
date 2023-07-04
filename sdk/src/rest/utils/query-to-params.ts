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
					const nestedField = value[key as keyof typeof value] ?? [];

					if (Array.isArray(nestedField)) {
						// regular nested fields
						for (const item of nestedField) {
							result.push(walkFields(item as FieldItem, [...chain, key]));
						}
					} else if (typeof nestedField === 'object') {
						// many to any nested
						for (const scope of Object.keys(nestedField)) {
							const fields = nestedField[scope as keyof typeof nestedField] as FieldItem[];
							
							for (const item of fields) {
								result.push(walkFields(item as FieldItem, [...chain, `${key}:${scope}`]));
							}
						}
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
