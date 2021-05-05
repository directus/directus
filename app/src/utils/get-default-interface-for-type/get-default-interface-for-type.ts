import { types } from '@/types';

const defaultInterfaceMap: Record<typeof types[number], string> = {
	alias: 'input',
	bigInteger: 'numeric',
	binary: 'input',
	boolean: 'toggle',
	date: 'datetime',
	dateTime: 'datetime',
	decimal: 'numeric',
	float: 'numeric',
	integer: 'numeric',
	json: 'input-code',
	string: 'input',
	text: 'input-multiline',
	time: 'datetime',
	timestamp: 'datetime',
	uuid: 'input',
	unknown: 'input',
	csv: 'tags',
	hash: 'hash',
};

/**
 * @todo default to correct interfaces for uuid / enum
 */

export default function getDefaultInterfaceForType(type: typeof types[number]): string {
	return defaultInterfaceMap[type] || 'input';
}
