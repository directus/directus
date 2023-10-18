import type { AggregationTypes, GroupByFields, Query } from '../../types/index.js';

type ExtendedQuery<Schema extends object, Item> = Query<Schema, Item> & {
	aggregate?: Record<keyof AggregationTypes, string>;
	groupBy?: (string | GroupByFields<Schema, Item>)[];
};

/**
 * Transform nested query object to an url compatible format
 *
 * @param query The nested query object
 *
 * @returns Flat query parameters
 */
export const queryToParams = <Schema extends object, Item>(
	query: ExtendedQuery<Schema, Item>
): Record<string, string> => {
	const params: Record<string, string> = {};

	if (Array.isArray(query.fields) && query.fields.length > 0) {
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
							const fields = (nestedField as Record<string, FieldItem[]>)[scope]!;

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

	if (query.filter && Object.keys(query.filter).length > 0) {
		params['filter'] = JSON.stringify(query.filter);
	}

	if (query.search) {
		// covers both empty string and undefined
		params['search'] = query.search;
	}

	if ('sort' in query && query.sort) {
		// covers empty array and undefined
		params['sort'] = typeof query.sort === 'string' ? query.sort : query.sort.join(',');
	}

	if (typeof query.limit === 'number' && query.limit >= -1) {
		params['limit'] = String(query.limit);
	}

	if (typeof query.offset === 'number' && query.offset >= 0) {
		params['offset'] = String(query.offset);
	}

	if (typeof query.page === 'number' && query.page >= 1) {
		params['page'] = String(query.page);
	}

	if (query.deep && Object.keys(query.deep).length > 0) {
		params['deep'] = JSON.stringify(query.deep);
	}

	if (query.alias && Object.keys(query.alias).length > 0) {
		params['alias'] = JSON.stringify(query.alias);
	}

	if (query.aggregate && Object.keys(query.aggregate).length > 0) {
		params['aggregate'] = JSON.stringify(query.aggregate);
	}

	if (query.groupBy && query.groupBy.length > 0) {
		params['groupBy'] = query.groupBy.join(',');
	}

	for (const [key, value] of Object.entries(query)) {
		if (key in params) continue;

		if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
			params[key] = String(value);
		} else {
			params[key] = JSON.stringify(value);
		}
	}

	return params;
};
