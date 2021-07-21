import { types } from '@/types';

const defaultInterfaceMap: Record<typeof types[number], string> = {
	alias: 'input',
	bigInteger: 'input',
	binary: 'input',
	boolean: 'boolean',
	date: 'datetime',
	dateTime: 'datetime',
	decimal: 'input',
	float: 'input',
	integer: 'input',
	json: 'input-code',
	string: 'input',
	text: 'input-multiline',
	time: 'datetime',
	timestamp: 'datetime',
	uuid: 'input',
	unknown: 'input',
	csv: 'tags',
	hash: 'input-hash',
};

export function getDefaultInterfaceForType(type: typeof types[number]): string {
	return defaultInterfaceMap[type] || 'input';
}
