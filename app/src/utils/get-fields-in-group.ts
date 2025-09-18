import { Field } from '@directus/types';
import { isNil } from 'lodash';

/**
 * Get all fields that belong to a specific group, including nested groups
 *
 * @param group - The group field name to search for, or null for root fields
 * @param allFields - Array of all available fields
 * @param passed - Array of already processed groups to prevent circular references
 * @returns Array of fields that belong to the specified group
 */

export function getFieldsInGroup(group: null | string, allFields: Field[], passed: string[] = []): Field[] {
	const fieldsInGroup: Field[] = allFields.filter((field) => {
		return field.meta?.group === group || (group === null && isNil(field.meta));
	});

	for (const field of fieldsInGroup) {
		if (field.meta?.special?.includes('group') && !passed.includes(field.meta!.field)) {
			passed.push(field.meta!.field);
			fieldsInGroup.push(...getFieldsInGroup(field.meta!.field, allFields, passed));
		}
	}

	return fieldsInGroup;
}
