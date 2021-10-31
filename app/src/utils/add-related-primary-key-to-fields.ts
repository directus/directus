import { useFieldsStore } from '@/stores/';

/**
 * Adds the primary key field for any passed relational dot-notation field to the array of fields.
 * Useful for cases where you need to fetch a single piece of nested relational data, but also need
 * access to its primary key.
 *
 * @example
 * const collection = 'articles';
 * const fields = ['title', 'user.name'];
 *
 * addRelatedPrimaryKeyToFields(collection, fields);
 * // => ['title', 'user.name', 'user.id'];
 */
export function addRelatedPrimaryKeyToFields(currentCollection: string, fields: string[]): string[] {
	if (!fields?.length) return [];

	const fieldsStore = useFieldsStore();

	const sanitizedFields: string[] = [];

	for (const fieldName of fields) {
		sanitizedFields.push(fieldName);

		if (!fieldName.includes('.')) continue;
		const fieldParts = fieldName.split('.');

		const field = fieldsStore.getField(currentCollection, fieldName);
		const primaryKeyField = fieldsStore.getPrimaryKeyFieldForCollection(field?.collection ?? '');

		const includeField = fieldParts.slice(0, -1).concat(primaryKeyField.field).join('.');

		if (!sanitizedFields.includes(includeField)) {
			sanitizedFields.push(includeField);
		}
	}

	return sanitizedFields;
}
