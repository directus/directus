import { useFieldsStore } from '@/stores/';
import useCollection from '@/composables/use-collection';

export function sanitizeFieldsToFetch(currentCollection: string, fields: string[]): string[] {
	if (!fields?.length) return [];

	const fieldsStore = useFieldsStore();

	const sanitizedFields: string[] = [];

	for (const [index, fieldName] of fields.entries()) {
		sanitizedFields.push(fieldName);

		if (!fieldName.includes('.')) continue;
		const fieldParts = fieldName.split('.');

		const field = fieldsStore.getField(currentCollection, fieldName);
		const { primaryKeyField } = useCollection(field.collection);

		const includeField = fieldParts.slice(0, -1).concat(primaryKeyField.value.field).join('.');

		if (!sanitizedFields.includes(includeField)) {
			sanitizedFields.push(includeField);
		}
	}

	return sanitizedFields;
}
