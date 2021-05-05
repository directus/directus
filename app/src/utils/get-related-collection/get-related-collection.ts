import { useFieldsStore, useRelationsStore } from '@/stores/';
import { Collection } from '@/types';

export default function getRelatedCollection(collection: string, field: string): Collection {
	const relationsStore = useRelationsStore();
	const fieldsStore = useFieldsStore();

	const relations = relationsStore.getRelationsForField(collection, field);

	const fieldInfo = fieldsStore.getField(collection, field);

	const type = fieldInfo.type.toLowerCase();

	// o2m | m2m
	if (['o2m', 'm2m', 'm2a', 'alias', 'translations', 'files'].includes(type)) {
		return relations[0].many_collection;
	}

	return relations[0].one_collection;
}
