import api from '@/api';
import { getFieldsFromTemplate } from '@/utils/get-fields-from-template';
import { computed, Ref, ref, watch } from '@vue/composition-api';
import { ComputedRef } from '@vue/composition-api';
import { Collection } from '@/types';

export default function useTemplateData(collection: ComputedRef<Collection | undefined>, primaryKey: Ref<string>) {
	const templateData = ref<Record<string, any>>();
	const loading = ref(false);
	const error = ref(null);

	const fields = computed(() => {
		if (!collection.value?.meta?.display_template) return null;
		return getFieldsFromTemplate(collection.value.meta.display_template);
	});

	watch([collection, primaryKey], fetchTemplateValues, { immediate: true });

	return { templateData, loading, error };

	async function fetchTemplateValues() {
		if (!primaryKey.value || primaryKey.value === '+' || fields.value === null || !collection.value) return;

		loading.value = true;

		const endpoint = collection.value.collection.startsWith('directus_')
			? `/${collection.value.collection.substring(9)}/${primaryKey.value}`
			: `/items/${collection.value.collection}/${encodeURIComponent(primaryKey.value)}`;

		try {
			const result = await api.get(endpoint, {
				params: {
					fields: fields.value,
				},
			});

			templateData.value = result.data.data;
		} catch (err) {
			error.value = err;
		} finally {
			loading.value = false;
		}
	}
}
