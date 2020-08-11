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

	const primaryKeyField = computed(() => {
		// Every collection has a primary key; rules of the land
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		return fields.value?.find(
			(field) => field.collection === collection.value && field.schema?.is_primary_key === true
		)!;
	});

	const userCreatedField = computed(() => {
		return fields.value?.find((field) => field.meta?.special === 'user_created') || null;
	});

	const statusField = computed(() => {
		return fields.value?.find((field) => field.meta?.special === 'status') || null;
	});

	const sortField = computed(() => {
		return fields.value?.find((field) => field.meta?.special === 'sort') || null;
	});

	type Status = {
		background_color: string;
		browse_badge: string;
		browse_subdued: string;
		name: string;
		published: boolean;
		required_fields: boolean;
		soft_delete: boolean;
		text_color: string;
		value: string;
	};

	const softDeleteStatus = computed<string | null>(() => {
		if (statusField.value === null) return null;

		const statuses = Object.values(statusField.value?.meta?.options?.status_mapping || {});
		return (
			(statuses.find((status) => (status as Status).soft_delete === true) as Status | undefined)?.value || null
		);
	});

	return { info, fields, primaryKeyField, userCreatedField, statusField, softDeleteStatus, sortField };
}
