import { useFieldsStore, useRelationsStore } from '@/stores/';

export default function getRelatedCollection(collection: string, field: string) {
	const relationsStore = useRelationsStore();
	const fieldsStore = useFieldsStore();

	const relations = relationsStore.getRelationsForField(collection, field);

	const fieldInfo = fieldsStore.getField(collection, field);
	const type = fieldInfo.type.toLowerCase();

	let relatedCollection: string | null = null;

	if (['user', 'user_updated', 'owner', 'file', 'm2o'].includes(type)) {
		relatedCollection = relations[0].one_collection;
	} else if (type === 'o2m') {
		relatedCollection = relations[0].many_collection;
	}

	return relatedCollection;
}
