import useFieldsStore from '@/stores/fields';
import displays from '@/displays';

export default function adjustFieldsForDisplays(
	fields: readonly string[],
	parentCollection: string
) {
	const fieldsStore = useFieldsStore();

	const adjustedFields = fields
		.map((fieldKey) => {
			const field = fieldsStore.getField(parentCollection, fieldKey);

			if (!field) return fieldKey;
			if (field.display === null) return fieldKey;

			const display = displays.find((d) => d.id === field.display);

			if (!display?.fields) return fieldKey;

			if (Array.isArray(display.fields)) {
				return display.fields.map(
					(relatedFieldKey: string) => `${fieldKey}.${relatedFieldKey}`
				);
			}

			return fieldKey;
		})
		.flat();

	return adjustedFields;
}
