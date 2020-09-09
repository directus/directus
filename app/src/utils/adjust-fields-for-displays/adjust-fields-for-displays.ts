import { useFieldsStore } from '@/stores/';
import { Field } from '@/types/';
import { getDisplays } from '@/displays';

export default function adjustFieldsForDisplays(fields: readonly string[], parentCollection: string) {
	const fieldsStore = useFieldsStore();
	const displays = getDisplays();

	const adjustedFields: string[] = fields
		.map((fieldKey) => {
			const field: Field = fieldsStore.getField(parentCollection, fieldKey);

			if (!field) return fieldKey;
			if (field.meta?.display === null) return fieldKey;

			const display = displays.value.find((d) => d.id === field.meta?.display);

			if (!display) return fieldKey;
			if (!display?.fields) return fieldKey;

			if (Array.isArray(display.fields)) {
				return display.fields.map((relatedFieldKey: string) => `${fieldKey}.${relatedFieldKey}`);
			}

			if (typeof display.fields === 'function') {
				return display
					.fields(field.meta?.display_options, {
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
