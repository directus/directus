import { RELATIONAL_TYPES } from '@directus/constants';
import type { DeepPartial, Field, FieldRaw, RelationalType } from '@directus/types';

export function isPrimaryKey(field: DeepPartial<Field>) {
	return field.schema?.is_primary_key === true;
}

export function isHidden(field: DeepPartial<Field>) {
	return field.meta?.hidden === true;
}

export function isRelational(field: DeepPartial<Field>) {
	return field.meta?.special?.find((type) => RELATIONAL_TYPES.includes(type as RelationalType)) !== undefined;
}

/**
 * Returns true for presentation-only alias fields (divider, header, notice, links). These are
 * identified by `type === 'alias'` with a `no-data` flag in `meta.special` and without the
 * `group` flag (which would indicate a field group container instead of a presentation field).
 */
export function isPresentationField(field: DeepPartial<Field> | FieldRaw) {
	if (field.type !== 'alias') return false;

	const special = field.meta?.special;

	if (!Array.isArray(special)) return false;

	return special.includes('no-data') && !special.includes('group');
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
