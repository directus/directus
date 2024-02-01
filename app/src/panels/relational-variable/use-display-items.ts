import { useCollectionsStore } from '@/stores/collections';
import { useFieldsStore } from '@/stores/fields';
import { adjustFieldsForDisplays } from '@/utils/adjust-fields-for-displays';
import { unexpectedError } from '@/utils/unexpected-error';
import { getEndpoint, getFieldsFromTemplate } from '@directus/utils';
import { useApi } from '@directus/composables';
import { computed, Ref, ref, watch } from 'vue';

export default function useDisplayItems(collection: Ref<string>, template: Ref<string>, ids: Ref<(string | number)[]>) {
	const collectionsStore = useCollectionsStore();
	const fieldStore = useFieldsStore();
	const api = useApi();

	const loading = ref(false);
	const displayItems = ref([]);

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

			const response = await api.get(getEndpoint(collection.value), {
				params: {
					fields: Array.from(fields),
					filter: { [primaryKey.value]: { _in: ids.value } },
				},
			});

			displayItems.value = response.data.data;
		} catch (error) {
			unexpectedError(error);
		} finally {
			loading.value = false;
		}
	}
}
