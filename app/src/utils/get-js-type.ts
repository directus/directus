import { Field } from '@directus/shared/types';

export function getJSType(field: Field): string {
	if (
		Array.isArray(field.meta?.special) &&
		field.meta!.special.some((special) => ['m2o', 'o2m', 'm2m', 'm2a', 'files', 'translations'].includes(special))
	)
		return 'object';
	if (['bigInteger', 'integer', 'float', 'decimal'].includes(field.type)) return 'number';
	if (['string', 'text', 'uuid', 'hash'].includes(field.type)) return 'string';
	if (['boolean'].includes(field.type)) return 'boolean';
	if (['time', 'timestamp', 'date', 'dateTime'].includes(field.type)) return 'string';
	if (['json', 'csv'].includes(field.type)) return 'object';
	if (field.type?.startsWith('geometry')) return 'object';
	return 'undefined';
}
