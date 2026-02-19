import type { Field } from '@directus/types';

/**
 * Determines if a field name represents a virtual field (prefixed with '$').
 * Virtual fields don't exist as real database columns and cannot be exported.
 */
export function isVirtualFieldName(fieldName: string): boolean {
	return fieldName.startsWith('$');
}

/**
 * Filters out virtual fields from a list of Field objects and returns their names as strings.
 * Excludes fields with type 'alias' or with field names prefixed with '$'.
 */
export function excludeVirtualFields(fields: Field[]): string[] {
	return fields
		.filter((field) => field.type !== 'alias' && !isVirtualFieldName(field.field))
		.map((field) => field.field);
}

/**
 * Filters out virtual field names from a list of field name strings.
 * Removes any field names prefixed with '$'.
 */
export function excludeVirtualFieldNames(fields: string[]): string[] {
	return fields.filter((field) => !isVirtualFieldName(field));
}
