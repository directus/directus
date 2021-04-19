import { computed, Ref, ref } from '@vue/composition-api';
import { useCollectionsStore, useFieldsStore } from '@/stores/';
import { Field } from '@/types';

export function useCollection(collectionKey: string | Ref<string>) {
	const collectionsStore = useCollectionsStore();
	const fieldsStore = useFieldsStore();

	const collection: Ref<string> = typeof collectionKey === 'string' ? ref(collectionKey) : collectionKey;

	const info = computed(() => {
		return collectionsStore.state.collections.find(({ collection: key }) => key === collection.value);
	});

	const fields = computed<Field[]>(() => {
		return fieldsStore.getFieldsForCollection(collection.value);
	});

	const defaults = computed(() => {
		if (!fields.value) return {};

		const defaults: Record<string, any> = {};

		for (const field of fields.value) {
			if (field.schema?.default_value) {
				defaults[field.field] = field.schema.default_value;
			}
		}

		return defaults;
	});

	const primaryKeyField = computed(() => {
		// Every collection has a primary key; rules of the land
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		return fields.value?.find(
			(field) => field.collection === collection.value && field.schema?.is_primary_key === true
		)!;
	});

	const userCreatedField = computed(() => {
		return fields.value?.find((field) => (field.meta?.special || []).includes('user_created')) || null;
	});

	const sortField = computed(() => {
		return info.value?.meta?.sort_field || null;
	});

	const isSingleton = computed(() => {
		return info.value?.meta?.singleton === true;
	});

	const accountabilityScope = computed(() => {
		if (!info.value) return null;
		if (!info.value.meta) return null;
		return info.value.meta.accountability;
	});

	return { info, fields, defaults, primaryKeyField, userCreatedField, sortField, isSingleton, accountabilityScope };
}
