import type { AggregationTypes, GroupByFields, Query } from '../../types/index.js';

type ExtendedQuery<Schema, Item> = Query<Schema, Item> & {
	aggregate?: Partial<Record<keyof AggregationTypes, string>>;
	groupBy?: (string | GroupByFields<Schema, Item>)[];
} & Record<string, unknown>;

export const formatFields = (fields: (string | Record<string, any>)[]) => {
	type FieldItem = (typeof fields)[number];

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

	return fields.flatMap((value) => walkFields(value));
};

const knownQueryKeys = [
	'fields',
	'filter',
	'search',
	'sort',
	'limit',
	'offset',
	'page',
	'deep',
	'backlink',
	'alias',
	'aggregate',
	'groupBy',
];

/**
 * Transform nested query object to an url compatible format
 *
 * @param query The nested query object
 *
 * @returns Flat query parameters
 */
export const queryToParams = <Schema = any, Item = Record<string, unknown>>(
	query: ExtendedQuery<Schema, Item>,
): Record<string, string> => {
	const params: Record<string, string> = {};

	if (query.fields) {
		if (Array.isArray(query.fields) && query.fields.length > 0) {
			params['fields'] = formatFields(query.fields).join(',');
		}

		// backwards JS compatibility for `fields: "id,name"`
		if (typeof query.fields === 'string') {
			params['fields'] = query.fields;
		}
	}

	if (query.filter && typeof query.filter === 'object' && Object.keys(query.filter).length > 0) {
		params['filter'] = JSON.stringify(query.filter);
	}

	if (query.search && typeof query.search === 'string') {
		params['search'] = query.search;
	}

	if (query.sort) {
		if (Array.isArray(query.sort) && query.sort.length > 0) {
			params['sort'] = query.sort.join(',');
		}

		if (typeof query.sort === 'string') {
			params['sort'] = query.sort;
		}
	}

	if ('limit' in query) {
		if (typeof query.limit === 'number' && query.limit >= -1) {
			params['limit'] = String(query.limit);
		}

		// backwards JS compatibility for string limits
		if (typeof query.limit === 'string' && Number(query.limit) >= -1) {
			params['limit'] = query.limit;
		}
	}

	if ('offset' in query) {
		if (typeof query.offset === 'number' && query.offset >= 0) {
			params['offset'] = String(query.offset);
		}

		// backwards JS compatibility for string offsets
		if (typeof query.offset === 'string' && Number(query.offset) >= 0) {
			params['offset'] = query.offset;
		}
	}

	if ('page' in query) {
		if (typeof query.page === 'number' && query.page >= 1) {
			params['page'] = String(query.page);
		}

		// backwards JS compatibility for string pages
		if (typeof query.page === 'string' && Number(query.page) >= 1) {
			params['page'] = query.page;
		}
	}

	if (query.deep && typeof query.deep === 'object' && Object.keys(query.deep).length > 0) {
		params['deep'] = JSON.stringify(query.deep);
	}

	if (query.alias && typeof query.alias === 'object' && Object.keys(query.alias).length > 0) {
		params['alias'] = JSON.stringify(query.alias);
	}

	if (query.aggregate && typeof query.aggregate === 'object' && Object.keys(query.aggregate).length > 0) {
		params['aggregate'] = JSON.stringify(query.aggregate);
	}

	if (query.groupBy) {
		if (Array.isArray(query.groupBy) && query.groupBy.length > 0) {
			params['groupBy'] = query.groupBy.join(',');
		}

		// backwards JS compatibility for string pages
		if (typeof query.groupBy === 'string') {
			params['groupBy'] = query.groupBy;
		}
	}

	for (const [key, value] of Object.entries(query)) {
		if (key in params || knownQueryKeys.includes(key)) continue;

		if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
			params[key] = String(value);
		} else {
			params[key] = JSON.stringify(value);
		}
	}

	return params;
};
