import api from '@/api';
import { Collection } from '@/types/collections';
import { adjustFieldsForDisplays } from '@/utils/adjust-fields-for-displays';
import { getEndpoint, getFieldsFromTemplate } from '@directus/shared/utils';
import { computed, Ref, ref, watch } from 'vue';

type UsableTemplateData = {
	templateData: Ref<Record<string, any> | undefined>;
	loading: Ref<boolean>;
	error: Ref<any>;
};

export function useTemplateData(collection: Ref<Collection | null>, primaryKey: Ref<string>): UsableTemplateData {
	const templateData = ref<Record<string, any>>();
	const loading = ref(false);
	const error = ref<any>(null);

	const fields = computed(() => {
		if (!collection.value?.meta?.display_template) return null;
		return adjustFieldsForDisplays(
			getFieldsFromTemplate(collection.value.meta.display_template),
			collection.value?.collection
		);
	});

	watch([collection, primaryKey], fetchTemplateValues, { immediate: true });

	return { templateData, loading, error };

	async function fetchTemplateValues() {
		if (!primaryKey.value || primaryKey.value === '+' || fields.value === null || !collection.value) return;

		loading.value = true;

		const baseEndpoint = getEndpoint(collection.value.collection);

		const endpoint = collection.value.collection.startsWith('directus_')
			? `${baseEndpoint}/${primaryKey.value}`
			: `${baseEndpoint}/${encodeURIComponent(primaryKey.value)}`;

		try {
			const result = await api.get(endpoint, {
				params: {
					fields: fields.value,
				},
			});

			templateData.value = result.data.data;
		} catch (err: any) {
			error.value = err;
		} finally {
			loading.value = false;
		}
	}
}
