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
		const meta = field.meta;

		const result =
			meta?.group === group ||
			(group === null && (isNil(meta) || isNil(meta.group)) && !meta?.special?.includes('group'));

		return result;
	});

	for (const field of fieldsInGroup) {
		const meta = field.meta;

		if (meta?.special?.includes('group') && !passed.includes(field.field)) {
			passed.push(field.field);
			fieldsInGroup.push(...getFieldsInGroup(field.field, allFields, passed));
		}
	}

	return fieldsInGroup;
}
