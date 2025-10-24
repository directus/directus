import { Filter } from '@directus/types';
import { get, isPlainObject } from 'lodash';

export function getNodeName(node: Filter): string {
	if (!node) return '';
	const keys = Object.keys(node);
	return keys[0] || '';
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
	const field = getField(node);
	if (!field) return '';
	const fieldNode = get(node, field);
	if (!fieldNode) return '';
	return getNodeName(fieldNode);
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

/**
 * Strip relationship field prefix from filter field paths
 * Used when displaying filters within a _none group to show cleaner field names
 */
export function stripRelationshipPrefix(filters: Filter[], relationshipField: string): Filter[] {
	return filters.map((filter) => {
		const result: Record<string, any> = {};

		for (const [key, value] of Object.entries(filter)) {
			if (key === '_and' || key === '_or') {
				result[key] = stripRelationshipPrefix(value as Filter[], relationshipField);
			} else if (key.startsWith(relationshipField + '.')) {
				const newKey = key.slice(relationshipField.length + 1);
				result[newKey] = value;
			} else {
				result[key] = value;
			}
		}

		return result as Filter;
	});
}

/**
 * Add relationship field prefix to filter field paths
 * Used when saving filters within a _none group to ensure correct path structure
 */
export function addRelationshipPrefix(filters: Filter[], relationshipField: string): Filter[] {
	return filters.map((filter) => {
		const result: Record<string, any> = {};

		for (const [key, value] of Object.entries(filter)) {
			if (key === '_and' || key === '_or') {
				result[key] = addRelationshipPrefix(value as Filter[], relationshipField);
			} else if (!key.startsWith(relationshipField + '.')) {
				const newKey = `${relationshipField}.${key}`;
				result[newKey] = value;
			} else {
				result[key] = value;
			}
		}

		return result as Filter;
	});
}
