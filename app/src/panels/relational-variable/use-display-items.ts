import { useSdk } from '@directus/composables';
import { Item } from '@directus/types';
import { getEndpoint, getFieldsFromTemplate } from '@directus/utils';
import { computed, Ref, ref, watch } from 'vue';
import { requestEndpoint } from '@/sdk';
import { useCollectionsStore } from '@/stores/collections';
import { useFieldsStore } from '@/stores/fields';
import { adjustFieldsForDisplays } from '@/utils/adjust-fields-for-displays';
import { unexpectedError } from '@/utils/unexpected-error';

export default function useDisplayItems(collection: Ref<string>, template: Ref<string>, ids: Ref<(string | number)[]>) {
	const collectionsStore = useCollectionsStore();
	const fieldStore = useFieldsStore();
	const sdk = useSdk();

	const loading = ref(false);
	const displayItems: Ref<Item[]> = ref([]);

	const primaryKey = computed(() => fieldStore.getPrimaryKeyFieldForCollection(collection.value)?.field ?? '');

	const displayTemplate = computed(() => {
		if (template.value) return template.value;

		const displayTemplate = collectionsStore.getCollection(collection.value)?.meta?.display_template;

		return displayTemplate || `{{ ${primaryKey.value || 'id'} }}`;
	});

	const requiredFields = computed(() => {
		if (!displayTemplate.value || !collection.value) return [];
		return adjustFieldsForDisplays(getFieldsFromTemplate(displayTemplate.value), collection.value);
	});

	watch(ids, getDisplayItems, { immediate: true });

	return { displayItems, displayTemplate, loading, primaryKey };

	async function getDisplayItems() {
		if (!ids.value || ids.value.length === 0) {
			displayItems.value = [];
			return;
		}

		if (!collection.value || !primaryKey.value) return;

		const fields = new Set(requiredFields.value);
		fields.add(primaryKey.value);

		try {
			loading.value = true;

			const response = await sdk.request<Item[]>(
				requestEndpoint(getEndpoint(collection.value), {
					params: {
						fields: Array.from(fields),
						filter: { [primaryKey.value]: { _in: ids.value } },
					},
				}),
			);

			displayItems.value = response;
		} catch (error) {
			unexpectedError(error);
		} finally {
			loading.value = false;
		}
	}
}
