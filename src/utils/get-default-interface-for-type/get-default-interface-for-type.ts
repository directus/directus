import { Type } from '@/stores/fields/types';

const defaultInterfaceMap = {
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
	unknown: 'text-input',
};

export default function getDefaultInterfaceForType(type: Type) {
	return defaultInterfaceMap[type] || 'text-input';
}
