import { useStores } from './use-system.js';
import type { AppCollection, Field } from '@directus/types';
import type { ComputedRef, Ref } from 'vue';
import { computed, ref } from 'vue';

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

/**
 * A Vue composable that provides reactive access to collection metadata, fields, and computed properties.
 *
 * This composable serves as a centralized way to access and work with Directus collections,
 * providing reactive computed properties for collection information, field definitions,
 * default values, and various collection-specific metadata.
 *
 * @param collectionKey - The collection identifier. Can be a string or a reactive reference to a string.
 *                        If null, most computed properties will return empty/null values.
 *
 * @returns An object containing reactive computed properties for the collection:
 * - `info` - The complete collection configuration object or null if not found
 * - `fields` - Array of sorted field definitions for the collection
 * - `defaults` - Object mapping field names to their default values from schema
 * - `primaryKeyField` - The field marked as primary key, or null if none exists
 * - `userCreatedField` - The field with 'user_created' special type, or null if none exists
 * - `sortField` - The field name used for sorting, from collection meta, or null
 * - `isSingleton` - Boolean indicating if the collection is configured as a singleton
 * - `accountabilityScope` - The accountability scope setting ('all', 'activity', or null)
 *
 * @example
 * ```typescript
 * // Using with a static collection name
 * const { info, fields, primaryKeyField } = useCollection('users');
 *
 * // Using with a reactive collection name
 * const collectionName = ref('articles');
 * const { fields, defaults, isSingleton } = useCollection(collectionName);
 *
 * // Accessing properties
 * console.log(info.value?.name); // Collection display name
 * console.log(fields.value.length); // Number of fields
 * console.log(primaryKeyField.value?.field); // Primary key field name
 * ```
 */
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
		return info.value?.meta?.accountability || null;
	});

	return { info, fields, defaults, primaryKeyField, userCreatedField, sortField, isSingleton, accountabilityScope };
}
