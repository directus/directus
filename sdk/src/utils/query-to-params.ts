import type { AggregationTypes, GroupByFields, Query } from '../types/index.js';
import { formatFields } from './format-fields.js';

type ExtendedQuery<Schema, Item> = Query<Schema, Item> & {
	aggregate?: Partial<Record<keyof AggregationTypes, string>>;
	groupBy?: (string | GroupByFields<Schema, Item>)[];
	version?: string | undefined;
	versionRaw?: boolean | undefined;
} & Record<string, unknown>;

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
	'version',
	'versionRaw',
];

/**
 * Local utility functions
 */
const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';
const isString = (value: unknown): value is string => typeof value === 'string' && Boolean(value);
const isNumber = (value: unknown): value is number => typeof value === 'number';
const isArray = (value: unknown): value is unknown[] => Array.isArray(value) && value.length > 0;

const isObject = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !isArray(value) && Object.keys(value).length > 0;

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
		if (isArray(query.fields)) params['fields'] = formatFields(query.fields).join(',');
		// backwards JS compatibility for `fields: "id,name"`
		if (isString(query.fields)) params['fields'] = query.fields;
	}

	if (isObject(query.filter)) params['filter'] = JSON.stringify(query.filter);

	if (isString(query.search)) params['search'] = query.search;

	if (query.sort) {
		if (isArray(query.sort)) params['sort'] = query.sort.join(',');
		if (isString(query.sort)) params['sort'] = query.sort;
	}

	if ('limit' in query) {
		if (isNumber(query.limit) && query.limit >= -1) params['limit'] = String(query.limit);
		// backwards JS compatibility for string limits
		if (isString(query.limit)) params['limit'] = query.limit;
	}

	if ('offset' in query) {
		if (isNumber(query.offset) && query.offset >= 0) params['offset'] = String(query.offset);
		// backwards JS compatibility for string offsets
		if (isString(query.offset)) params['offset'] = query.offset;
	}

	if ('page' in query) {
		if (isNumber(query.page) && query.page >= 1) params['page'] = String(query.page);
		// backwards JS compatibility for string pages
		if (isString(query.page)) params['page'] = query.page;
	}

	if (isObject(query.deep)) params['deep'] = JSON.stringify(query.deep);

	if (isObject(query.alias)) params['alias'] = JSON.stringify(query.alias);

	if (isObject(query.aggregate)) params['aggregate'] = JSON.stringify(query.aggregate);

	if (query.groupBy) {
		if (isArray(query.groupBy)) params['groupBy'] = query.groupBy.join(',');
		// backwards JS compatibility for `groupBy: "id,name"`
		if (isString(query.groupBy)) params['groupBy'] = query.groupBy;
	}

	if (isString(query.version)) params['version'] = query.version;

	if (query.versionRaw) {
		if (isBoolean(query.versionRaw)) params['versionRaw'] = String(query.versionRaw);
		// backwards JS compatibility for `versionRaw: "true"`
		if (isString(query.versionRaw)) params['versionRaw'] = query.versionRaw;
	}

	// parse custom parameters
	for (const [key, value] of Object.entries(query)) {
		if (knownQueryKeys.includes(key)) continue;
		let stringValue: string | undefined;

		if (typeof value === 'string') {
			stringValue = value;
		} else {
			// `JSON.stringify` can return `undefined` for types it cannot serialize
			// Example: JSON.stringify(() => {}) -> undefined
			stringValue = JSON.stringify(value) as string | undefined;
		}

		if (stringValue) {
			params[key] = stringValue;
		}
	}

	return params;
};
