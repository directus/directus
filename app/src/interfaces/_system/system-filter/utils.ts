import type { ClientFilterOperator, FieldFilter, FieldFilterOperator, Filter } from '@directus/types';
import { toArray } from '@directus/utils';
import { get, isPlainObject } from 'lodash';

export const JSON_VALUE_KEY = '$jsonValue';

export const JSON_FILTER_OPERATORS: ClientFilterOperator[] = [
	'eq',
	'neq',
	'lt',
	'lte',
	'gt',
	'gte',
	'in',
	'nin',
	'null',
	'nnull',
	'contains',
	'ncontains',
	'icontains',
	'starts_with',
	'nstarts_with',
	'istarts_with',
	'nistarts_with',
	'ends_with',
	'nends_with',
	'iends_with',
	'niends_with',
	'between',
	'nbetween',
	'empty',
	'nempty',
];

export function getNodeName(node: Filter): string {
	if (!node) return '';
	return Object.keys(node)[0] ?? '';
}

export function getField(node: Record<string, any>): string {
	const name = getNodeName(node);
	if (name.startsWith('_')) return '';
	if (!isPlainObject(node[name])) return '';

	const subFields = getField(node[name]);
	return subFields !== '' ? `${name}.${subFields}` : name;
}

export function fieldHasFunction(field: string) {
	return field.includes('(') && field.includes(')');
}

export function getComparator(node: Record<string, any>): string {
	return getNodeName(get(node, getField(node)));
}

const booleanComparators = ['_null', '_nnull', '_empty', '_nempty'];
const geometryComparators = ['_intersects', '_nintersects', '_intersects_bbox', '_nintersects_bbox'];

export function initialValueForComparator(comparator: string, value: unknown, previousComparator?: string): unknown {
	if (['_in', '_nin'].includes(comparator)) {
		return toArray(value);
	}

	if (['_between', '_nbetween'].includes(comparator)) {
		return toArray(value).slice(0, 2);
	}

	if (booleanComparators.includes(comparator)) {
		return true;
	}

	if (geometryComparators.includes(comparator)) {
		return previousComparator && geometryComparators.includes(previousComparator) ? value : null;
	}

	if (previousComparator && booleanComparators.includes(previousComparator)) {
		return null;
	}

	return Array.isArray(value) ? value[0] : value;
}

export function fieldToFilter(field: string, operator: string, value: any): Record<string, any> {
	return fieldToFilterR(field.split('.'));

	function fieldToFilterR(sections: string[]): Record<string, any> {
		const section = sections.shift();

		if (section !== undefined) {
			return {
				[section]: fieldToFilterR(sections),
			};
		} else {
			return {
				[operator]: value,
			};
		}
	}
}

export type JsonFilterParts = {
	field: string;
	path: string;
	operator: keyof FieldFilterOperator;
	value: unknown;
	valueNode: FieldFilter;
};

export function buildJsonFilter(
	field: string,
	path: string,
	operator: keyof FieldFilterOperator,
	value: unknown,
): FieldFilter {
	const jsonFilter = path ? { [path]: { [operator]: value } } : {};
	return fieldToFilter(field, '_json', jsonFilter) as FieldFilter;
}

export function getJsonFilterParts(node: Filter): JsonFilterParts {
	const field = getField(node as Record<string, any>);
	const jsonFilter = (get(node, `${field}._json`) ?? {}) as Record<string, FieldFilterOperator>;
	const [path = '', innerFilter = { _eq: null }] = Object.entries(jsonFilter)[0] ?? [];
	const [operator = '_eq', value = null] = Object.entries(innerFilter)[0] ?? [];

	return {
		field,
		path,
		operator: operator as keyof FieldFilterOperator,
		value,
		valueNode: { [JSON_VALUE_KEY]: { [operator]: value } },
	};
}

export function isJsonFilter(node: Filter): boolean {
	if (getComparator(node as Record<string, any>) !== '_json') {
		return false;
	}

	const field = getField(node as Record<string, any>);
	const paths = Object.keys((get(node, `${field}._json`) ?? {}) as Record<string, unknown>);

	return paths.length === 0 || (paths.length === 1 && !['_and', '_or'].includes(paths[0]!));
}

const stringComparators: (keyof FieldFilterOperator)[] = [
	'_contains',
	'_ncontains',
	'_icontains',
	'_starts_with',
	'_nstarts_with',
	'_istarts_with',
	'_nistarts_with',
	'_ends_with',
	'_nends_with',
	'_iends_with',
	'_niends_with',
];

export function coerceJsonFilterValue(value: unknown, operator: keyof FieldFilterOperator): unknown {
	if (stringComparators.includes(operator)) {
		return value;
	}

	if (Array.isArray(value)) {
		return value.map((entry) => coerceJsonFilterValue(entry, operator));
	}

	if (typeof value !== 'string') {
		return value;
	}

	try {
		return JSON.parse(value);
	} catch {
		return value;
	}
}
