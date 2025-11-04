import { RELATIONAL_TYPES } from '@directus/constants';
import type { Field, RelationalType } from '@directus/types';

export function isPrimaryKey(field: Field) {
	return field.schema?.is_primary_key === true;
}

export function isHidden(field: Field) {
	return field.meta?.hidden === true;
}

export function isRelational(field: Field) {
	return field.meta?.special?.find((type) => RELATIONAL_TYPES.includes(type as RelationalType)) !== undefined;
}

export function isDateUpdated(field: Field) {
	return field.meta?.special?.some((type) => type === 'date-updated') ?? false;
}

export function isDateCreated(field: Field) {
	return field.meta?.special?.some((type) => type === 'date-created') ?? false;
}

export function isUserUpdated(field: Field) {
	return field.meta?.special?.some((type) => type === 'user-updated') ?? false;
}

export function isUserCreated(field: Field) {
	return field.meta?.special?.some((type) => type === 'user-created') ?? false;
}
