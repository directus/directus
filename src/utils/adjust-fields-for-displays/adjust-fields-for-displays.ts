import useFieldsStore from '@/stores/fields';
import displays from '@/displays';
import { Field } from '@/stores/fields/types';

export default function adjustFieldsForDisplays(
	fields: readonly string[],
	parentCollection: string
) {
	const fieldsStore = useFieldsStore();

	const adjustedFields: string[] = fields
		.map((fieldKey) => {
			const field: Field = fieldsStore.getField(parentCollection, fieldKey);

			if (!field) return fieldKey;
			if (field.display === null) return fieldKey;

			const display = displays.find((d) => d.id === field.display);

			if (!display?.fields) return fieldKey;

			if (Array.isArray(display.fields)) {
				return display.fields.map(
					(relatedFieldKey: string) => `${fieldKey}.${relatedFieldKey}`
				);
			}

			if (typeof display.fields === 'function') {
				return display
					.fields(field.display_options, {
						collection: parentCollection,
						field: fieldKey,
						type: field.type,
					})
					.map((relatedFieldKey: string) => `${fieldKey}.${relatedFieldKey}`);
			}

			return fieldKey;
		})
		.flat();

	return adjustedFields;
}
