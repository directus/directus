import { get, isPlainObject } from 'lodash';
import { Filter } from '@directus/types';

export function getNodeName(node: Filter): string | undefined {
	return Object.keys(node)[0];
}

export function getKeyPath(node: Record<string, any>): string {
	const name = getNodeName(node);
	if (!name || !isPlainObject(node[name])) return '';

	const subFields = getKeyPath(node[name]);
	return subFields !== '' ? `${name}.${subFields}` : name;
}

export function getField(node: Record<string, any>): string {
	return getKeyPath(node)
		.split('.')
		.filter((key) => !key.startsWith('_'))
		.join('.');
}

export function getComparator(node: Record<string, any>): string {
	return getNodeName(get(node, getKeyPath(node)))!;
}

export function getValue(node: Record<string, any>): any {
	return get(node, `${getKeyPath(node)}.${getComparator(node)}`);
}

export function isSome(node: Record<string, any>): boolean {
	return getNodeName(get(node, getNodeName(node)!)) !== '_none';
}

export function fieldToFilter(field: string, operator: string, value: any, some: boolean): Record<string, any> {
	const initialSections = field.split('.');
	return fieldToFilterR([...initialSections]);

	function fieldToFilterR(sections: string[]): Record<string, any> {
		const section = sections.shift();

		if (section && initialSections.length === sections.length + 1 && !some) {
			return {
				[section]: {
					_none: fieldToFilterR(sections),
				},
			};
		} else if (section) {
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
