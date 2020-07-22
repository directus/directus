import { Type } from '@/stores/fields/types';

const defaultInterfaceMap: Record<Type, string> = {
	alias: 'text-input',
	bigInteger: 'numeric',
	binary: 'text-input',
	boolean: 'toggle',
	date: 'datetime',
	datetime: 'datetime',
	decimal: 'numeric',
	float: 'numeric',
	integer: 'numeric',
	json: 'json',
	string: 'text-input',
	text: 'textarea',
	time: 'datetime',
	timestamp: 'datetime',
	enum: 'text-input',
	uuid: 'text-input',
	unknown: 'text-input',
};

/**
 * @todo default to correct interfaces for uuid / enum
 */

export default function getDefaultInterfaceForType(type: Type) {
	return defaultInterfaceMap[type] || 'text-input';
}
