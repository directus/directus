import api from '@/api';
import { Collection } from '@/types/collections';
import { adjustFieldsForDisplays } from '@/utils/adjust-fields-for-displays';
import { getEndpoint, getFieldsFromTemplate } from '@directus/utils';
import { Ref, computed, ref, watch } from 'vue';

type UsableTemplateData = {
	templateData: Ref<Record<string, any> | undefined>;
	loading: Ref<boolean>;
	fetchTemplateValues: () => Promise<void>;
	error: Ref<any>;
};

export function useTemplateData(
	collection: Ref<Collection | null>,
	primaryKey: Ref<string>,
	template?: Ref<string>
): UsableTemplateData {
	const templateData = ref<Record<string, any>>();
	const loading = ref(false);
	const error = ref<any>(null);

	const fields = computed(() => {
		const _template = template?.value || collection.value?.meta?.display_template;

		if (!_template || !collection.value) return null;

		return adjustFieldsForDisplays(getFieldsFromTemplate(_template), collection.value?.collection);
	});

	const isSingleton = computed(() => !!collection.value?.meta?.singleton);

	watch([collection, primaryKey], fetchTemplateValues, { immediate: true });

	return { templateData, loading, error, fetchTemplateValues };

	async function fetchTemplateValues() {
		if (
			(!primaryKey.value && !isSingleton.value) ||
			primaryKey.value === '+' ||
			fields.value === null ||
			!collection.value
		) {
			return;
		}

		loading.value = true;

		const baseEndpoint = getEndpoint(collection.value.collection);

		let endpoint: string;

		if (isSingleton.value) {
			endpoint = baseEndpoint;
		} else {
			endpoint = collection.value.collection.startsWith('directus_')
				? `${baseEndpoint}/${primaryKey.value}`
				: `${baseEndpoint}/${encodeURIComponent(primaryKey.value)}`;
		}

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
