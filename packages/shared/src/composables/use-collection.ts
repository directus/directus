import { useStores } from './use-system';
import { Collection, Field } from '../types';
import { computed, ref, Ref, ComputedRef } from 'vue';

export type UsableCollection = {
	collection: Ref<string | null>;
	info: ComputedRef<Collection | null>;
	fields: ComputedRef<Field[]>;
	defaults: Record<string, any>;
	primaryKeyField: ComputedRef<Field | null>;
	userCreatedField: ComputedRef<Field | null>;
	sortField: ComputedRef<string | null>;
	isSingleton: ComputedRef<boolean>;
	accountabilityScope: ComputedRef<'all' | 'activity' | null>;
	displayTemplate: ComputedRef<string | null>;
};

export function useCollection(collectionKey: string | Ref<string | null>): UsableCollection {
	const { useCollectionsStore, useFieldsStore } = useStores();
	const collectionsStore = useCollectionsStore();
	const fieldsStore = useFieldsStore();

	const collection: Ref<string | null> = typeof collectionKey === 'string' ? ref(collectionKey) : collectionKey;

	const info = computed(() => {
		return (
			(collectionsStore.collections as Collection[]).find(({ collection: key }) => key === collection.value) || null
		);
	});

	const fields = computed(() => {
		if (!collection.value) return [];
		return fieldsStore.getFieldsForCollection(collection.value) as Field[];
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

	const displayTemplate = computed(() => {
		return info.value?.meta?.display_template ?? null;
	});

	return {
		collection,
		info,
		fields,
		defaults,
		primaryKeyField,
		userCreatedField,
		sortField,
		isSingleton,
		accountabilityScope,
		displayTemplate,
	};
}
