import { APP_NUMERIC_STRING_TYPES, APP_NUMERIC_TYPES } from '@/constants';
import { Field } from '@directus/types';

export function getJSType(field: Field): string {
	if (
		Array.isArray(field.meta?.special) &&
		field.meta!.special.some((special) => ['m2o', 'o2m', 'm2m', 'm2a', 'files', 'translations'].includes(special))
	) {
		return 'object';
	}

	if (APP_NUMERIC_TYPES.includes(field.type)) return 'number';

	if (field.type === 'boolean') return 'boolean';

	if (['json', 'csv'].includes(field.type)) return 'object';

	if (field.type?.startsWith('geometry')) return 'object';

	const stringTypes = [
		'string',
		'text',
		'uuid',
		'hash',
		'time',
		'timestamp',
		'date',
		'dateTime',
		...APP_NUMERIC_STRING_TYPES,
	];

	if (stringTypes.includes(field.type)) return 'string';

	return 'undefined';
}
