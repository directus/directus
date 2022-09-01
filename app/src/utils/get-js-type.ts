import { Field } from '@directus/shared/types';

export function getJSType(field: Field): string {
	if (
		Array.isArray(field.meta?.special) &&
		field.meta!.special.some((special) => ['m2o', 'o2m', 'm2m', 'm2a', 'files', 'translations'].includes(special))
	)
		return 'object';

	switch (field.type) {
		case 'bigInteger':
		case 'integer':
		case 'float':
		case 'decimal':
			return 'number';
		case 'string':
		case 'text':
		case 'uuid':
		case 'hash':
		case 'time':
		case 'timestamp':
		case 'date':
		case 'dateTime':
			return 'string';
		case 'boolean':
			return 'boolean';
		case 'json':
		case 'csv':
			return 'object';
	}

	if (field.type?.startsWith('geometry')) return 'object';
	return 'undefined';
}
