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

	const statusField = computed(() => {
		return fields.value?.find((field) => field.type === 'status');
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

		const statuses = Object.values(statusField.value?.options?.status_mapping || {});
		return (
			(statuses.find((status) => (status as Status).soft_delete === true) as
				| Status
				| undefined)?.value || null
		);
	});

	return { info, fields, primaryKeyField, statusField, softDeleteStatus };
}
