import { types } from '@/types';

const defaultInterfaceMap: Record<typeof types[number], string> = {
	alias: 'text-input',
	bigInteger: 'numeric',
	binary: 'text-input',
	boolean: 'toggle',
	date: 'datetime',
	dateTime: 'datetime',
	decimal: 'numeric',
	float: 'numeric',
	integer: 'numeric',
	json: 'code',
	string: 'text-input',
	text: 'textarea',
	time: 'datetime',
	timestamp: 'datetime',
	uuid: 'text-input',
	unknown: 'text-input',
	csv: 'tags',
	hash: 'hash',
};

/**
 * @todo default to correct interfaces for uuid / enum
 */

export default function getDefaultInterfaceForType(type: typeof types[number]): string {
	return defaultInterfaceMap[type] || 'text-input';
}
