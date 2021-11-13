import { Field } from '@directus/shared/types';
import { useFieldsStore, useRelationsStore } from '@/stores';
import getRelatedCollection from '../get-related-collection';

export default function findLanguagesCollection(collection: string): string | null | undefined {
	const fieldsStore = useFieldsStore();
	const relationsStore = useRelationsStore();
	const collectionFields = fieldsStore.getFieldsForCollection(collection);

	for (const fieldData of collectionFields) {
		const relations = relationsStore.getRelationsForField(collection, fieldData.field);

		if (fieldData.meta?.special?.includes('translations')) {
			return getLanguagesCollection(collection, fieldData);
		} else if (fieldData.meta?.special?.includes('m2a')) {
			const m2aRelation = relations.find((relation) => relation.meta?.one_allowed_collections?.length);
			const allowedCollections = m2aRelation?.meta?.one_allowed_collections ?? [];
			for (const allowedCollection of allowedCollections) {
				const nestedLanguageCollection = findLanguagesCollection(allowedCollection);
				if (nestedLanguageCollection) return nestedLanguageCollection;
			}
		} else if (relations.length) {
			const relatedCollection = getRelatedCollection(collection, fieldData.field);
			const nestedLanguageCollection = findLanguagesCollection(relatedCollection);
			if (nestedLanguageCollection) return nestedLanguageCollection;
		}
	}

	return null;
}

function getLanguagesCollection(collection: string, translationsField: Field) {
	const relationsStore = useRelationsStore();
	const translationsRelations = relationsStore.getRelationsForField(collection, translationsField.field);
	const m2o = translationsRelations.find((relation) => relation.meta?.one_collection !== collection);
	return m2o?.related_collection;
}
