import { type MaybeRef, unref, computed } from 'vue';
import { useFieldsStore } from '@/stores/fields';
import { REQUIRED_FIELDS } from './schema';
import { Field } from '@directus/types';

export const useCollectionValidation = (collection: MaybeRef<string>) => {
	const fieldsStore = useFieldsStore();

	const validationIssues = computed(() => {
		const missingFields: Pick<Field, 'field' | 'type'>[] = [];
		const invalidFields: Pick<Field, 'field' | 'type'>[] = [];

		const existingFields = fieldsStore.getFieldsForCollection(unref(collection));

		for (const requiredField of REQUIRED_FIELDS) {
			const existingField = existingFields.find((existingField) => existingField.field === requiredField.field);

			if (!existingField) {
				missingFields.push(requiredField);
			}

			if (existingField && existingField.type !== requiredField.type) {
				invalidFields.push(requiredField);
			}
		}

		return { missingFields, invalidFields };
	});

	return validationIssues;
};
