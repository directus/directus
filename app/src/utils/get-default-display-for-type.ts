import { Type } from '@directus/shared/types';

const defaultDisplayMap: Record<Type, string> = {
	alias: 'raw',
	bigInteger: 'formatted-value',
	binary: 'raw',
	boolean: 'boolean',
	date: 'datetime',
	dateTime: 'datetime',
	decimal: 'formatted-value',
	float: 'formatted-value',
	integer: 'formatted-value',
	json: 'raw',
	string: 'formatted-value',
	text: 'formatted-value',
	time: 'datetime',
	timestamp: 'datetime',
	uuid: 'formatted-value',
	unknown: 'raw',
	csv: 'labels',
	hash: 'formatted-value',
	geometry: 'map',
};

export function getDefaultDisplayForType(type: Type): string {
	return defaultDisplayMap[type] || 'raw';
}
