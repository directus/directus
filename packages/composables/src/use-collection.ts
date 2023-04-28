import type { AppCollection, Field } from '@directus/types';
import type { ComputedRef, Ref } from 'vue';
import { computed, ref } from 'vue';
import { useStores } from './use-system.js';

export type UsableCollection = {
	info: ComputedRef<AppCollection | null>;
	fields: ComputedRef<Field[]>;
	defaults: ComputedRef<Record<string, any>>;
	primaryKeyField: ComputedRef<Field | null>;
	userCreatedField: ComputedRef<Field | null>;
	sortField: ComputedRef<string | null>;
	isSingleton: ComputedRef<boolean>;
	accountabilityScope: ComputedRef<'all' | 'activity' | null>;
};

export function useCollection(collectionKey: string | Ref<string | null>): UsableCollection {
	const { useCollectionsStore, useFieldsStore } = useStores();
	const collectionsStore = useCollectionsStore();
	const fieldsStore = useFieldsStore();

	const collection: Ref<string | null> = typeof collectionKey === 'string' ? ref(collectionKey) : collectionKey;

	const info = computed(() => {
		return (
			(collectionsStore.collections as AppCollection[]).find(({ collection: key }) => key === collection.value) || null
		);
	});

	const fields = computed(() => {
		if (!collection.value) return [];
		return fieldsStore.getFieldsForCollectionSorted(collection.value) as Field[];
	});

	const defaults = computed(() => {
		if (!fields.value) return {};

		const defaults: Record<string, any> = {};

		for (const field of fields.value) {
			if (field.schema !== null && 'default_value' in field.schema) {
				defaults[field.field] = field.schema.default_value;
			}
		}

		return defaults;
	});

	const primaryKeyField = computed(() => {
		return (
			fields.value.find((field) => field.collection === collection.value && field.schema?.is_primary_key === true) ||
			null
		);
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
