import { RELATIONAL_TYPES } from '@directus/constants';
import type { DeepPartial, Field, RelationalType } from '@directus/types';

export function isPrimaryKey(field: DeepPartial<Field>) {
	return field.schema?.is_primary_key === true;
}

export function isHidden(field: DeepPartial<Field>) {
	return field.meta?.hidden === true;
}

export function isRelational(field: DeepPartial<Field>) {
	return field.meta?.special?.find((type) => RELATIONAL_TYPES.includes(type as RelationalType)) !== undefined;
}

export function isDateUpdated(field: DeepPartial<Field>) {
	return field.meta?.special?.some((type) => type === 'date-updated') ?? false;
}

export function isDateCreated(field: DeepPartial<Field>) {
	return field.meta?.special?.some((type) => type === 'date-created') ?? false;
}

export function isUserUpdated(field: DeepPartial<Field>) {
	return field.meta?.special?.some((type) => type === 'user-updated') ?? false;
}

export function isUserCreated(field: DeepPartial<Field>) {
	return field.meta?.special?.some((type) => type === 'user-created') ?? false;
}
