import { types } from '@/types';

export function getJSType(type: typeof types[number]): string {
	if (['bigInteger', 'integer', 'float', 'decimal'].includes(type)) return 'number';
	if (['string', 'text', 'uuid', 'hash'].includes(type)) return 'string';
	if (['boolean'].includes(type)) return 'boolean';
	if (['time', 'timestamp', 'date', 'dateTime'].includes(type)) return 'string';
	if (['json', 'csv'].includes(type)) return 'object';
	return 'undefined';
}
