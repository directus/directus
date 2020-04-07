import { computed, Ref } from '@vue/composition-api';
import useCollectionsStore from '@/stores/collections';
import useFieldsStore from '@/stores/fields';

export function useCollection(collection: Ref<string>) {
	const collectionsStore = useCollectionsStore();
	const fieldsStore = useFieldsStore();

	const info = computed(() => {
		return collectionsStore.state.collections.find(
			({ collection: key }) => key === collection.value
		);
	});

	const fields = computed(() => {
		return fieldsStore.state.fields.filter((field) => field.collection === collection.value);
	});

	const primaryKeyField = computed(() => {
		return fields.value?.find(
			(field) => field.collection === collection.value && field.primary_key === true
		);
	});

	return { info, fields, primaryKeyField };
}
