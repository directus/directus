import { Field } from '@directus/types';
import { computed, type MaybeRef, unref } from 'vue';
import { REQUIRED_FIELDS } from './schema';
import { useCollectionsStore } from '@/stores/collections';
import { useFieldsStore } from '@/stores/fields';

export const useCollectionValidation = (collection: MaybeRef<string>) => {
	const collectionsStore = useCollectionsStore();
	const fieldsStore = useFieldsStore();

	const collectionAlreadyExists = computed(() => {
		const collectionName = unref(collection);
		if (!collectionName) return false;
		return collectionsStore.getCollection(collectionName) !== null;
	});

	const validationIssues = computed(() => {
		const missingFields: Pick<Field, 'field' | 'type'>[] = [];
		const invalidFields: Pick<Field, 'field' | 'type'>[] = [];

		if (!collectionAlreadyExists.value) {
			return { missingFields, invalidFields, collectionNotFound: true };
		}

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

		return { missingFields, invalidFields, collectionNotFound: false };
	});

	return validationIssues;
};
