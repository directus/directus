import { computed, Ref, ref } from '@vue/composition-api';
import { useRelationsStore } from '@/stores/';
import { Relation } from '@/types';

export default function useLanguagesCodeField(collectionKey: string | Ref<string>, fieldKey: string | Ref<string>) {
	const collection: Ref<string> = typeof collectionKey === 'string' ? ref(collectionKey) : collectionKey;
	const field: Ref<string> = typeof fieldKey === 'string' ? ref(fieldKey) : fieldKey;

	const relationsStore = useRelationsStore();

	const relationsForField = computed(() => {
		return relationsStore.getRelationsForField(collection.value, field.value);
	});

	const translationsRelation = computed(() => {
		if (!relationsForField.value) return null;
		return (
			relationsForField.value.find(
				(relation: Relation) => relation.one_collection === collection.value && relation.one_field === field.value
			) || null
		);
	});

	const languagesRelation = computed(() => {
		if (!relationsForField.value) return null;
		return relationsForField.value.find((relation: Relation) => relation !== translationsRelation.value) || null;
	});

	const languagesCodeField = computed(() => {
		return languagesRelation.value?.many_field;
	});

	return languagesCodeField;
}
