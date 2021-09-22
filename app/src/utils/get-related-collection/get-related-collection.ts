import { useFieldsStore, useRelationsStore } from '@/stores/';
import { Relation } from '@directus/shared/types';

export default function getRelatedCollection(collection: string, field: string): string {
	const relationsStore = useRelationsStore();
	const fieldsStore = useFieldsStore();

	const relations: Relation[] = relationsStore.getRelationsForField(collection, field);

	const fieldInfo = fieldsStore.getField(collection, field);

	const type = fieldInfo.type.toLowerCase();

	const o2mTypes = ['o2m', 'm2m', 'm2a', 'alias', 'translations', 'files'];
	if (o2mTypes.includes(type)) {
		return relations[0].collection;
	}

	return relations[0].related_collection!;
}
