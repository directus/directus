import useFieldsStore from '@/stores/fields';
import displays from '@/displays';
import { Field } from '@/stores/fields/types';

export default function adjustFieldsForDisplays(fields: readonly string[], parentCollection: string) {
	const fieldsStore = useFieldsStore();

	const adjustedFields: string[] = fields
		.map((fieldKey) => {
			const field: Field = fieldsStore.getField(parentCollection, fieldKey);

			if (!field) return fieldKey;
			if (field.system?.display === null) return fieldKey;

			const display = displays.find((d) => d.id === field.system?.display);

			if (!display) return fieldKey;
			if (!display?.fields) return fieldKey;

			if (Array.isArray(display.fields)) {
				return display.fields.map((relatedFieldKey: string) => `${fieldKey}.${relatedFieldKey}`);
			}

			if (typeof display.fields === 'function') {
				return display
					.fields(field.system?.display_options, {
						collection: field.collection,
						field: field.field,
						type: field.type,
					})
					.map((relatedFieldKey: string) => `${fieldKey}.${relatedFieldKey}`);
			}

			return fieldKey;
		})
		.flat();

	return adjustedFields;
}
