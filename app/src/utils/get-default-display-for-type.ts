import { types } from '@/types';

const defaultDisplayMap: Record<typeof types[number], string> = {
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
};

export function getDefaultDisplayForType(type: typeof types[number]): string {
	return defaultDisplayMap[type] || 'raw';
}
