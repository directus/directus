import { types } from '@/types';

const defaultInterfaceMap: Record<typeof types[number], string> = {
	alias: 'text-input',
	bigInteger: 'numeric',
	binary: 'text-input',
	boolean: 'toggle',
	date: 'datetime',
	dateTime: 'dateTime',
	decimal: 'numeric',
	float: 'numeric',
	integer: 'numeric',
	json: 'json',
	string: 'text-input',
	text: 'textarea',
	time: 'datetime',
	timestamp: 'datetime',
	uuid: 'text-input',
	unknown: 'text-input',
};

/**
 * @todo default to correct interfaces for uuid / enum
 */

export default function getDefaultInterfaceForType(type: typeof types[number]) {
	return defaultInterfaceMap[type] || 'text-input';
}
