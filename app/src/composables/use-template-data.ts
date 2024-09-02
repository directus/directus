import api from '@/api';
import { adjustFieldsForDisplays } from '@/utils/adjust-fields-for-displays';
import { Collection, Item, PrimaryKey } from '@directus/types';
import { getEndpoint, getFieldsFromTemplate } from '@directus/utils';
import { has, merge, pick } from 'lodash';
import { ComputedRef, Ref, computed, ref, watch } from 'vue';

type UsableTemplateData = {
	template: ComputedRef<string | null>;
	templateData: ComputedRef<Item | null>;
	loading: Ref<boolean>;
	error: Ref<any>;
	fetchTemplateValues: () => Promise<void>;
};

export function useTemplateData(
	collection: Ref<Collection | null>,
	primaryKey: Ref<PrimaryKey | null>,
	options?: {
		template?: Ref<string>;
		injectData?: Ref<Item>;
	},
): UsableTemplateData {
	const itemData = ref<Item | null>(null);
	const loading = ref(false);
	const error = ref<any>(null);

	const template = computed(() => options?.template?.value ?? collection.value?.meta?.display_template ?? null);

	const templateFields = computed(() => {
		if (!template.value || !collection.value) return null;

		return getFieldsFromTemplate(template.value);
	});

	const fields = computed(() => {
		if (!templateFields.value || !collection.value) return null;

		const injectData = options?.injectData?.value;

		return adjustFieldsForDisplays(
			injectData ? templateFields.value.filter((field) => !has(injectData, field)) : templateFields.value,
			collection.value.collection,
		);
	});

	const templateData = computed<Item | null>(() => {
		if (!itemData.value) return null;

		const injectData = options?.injectData?.value;

		if (!injectData || !templateFields.value) return itemData.value;

		return merge({}, itemData.value, pick(injectData, templateFields.value));
	});

	const isSingleton = computed(() => !!collection.value?.meta?.singleton);

	watch([collection, primaryKey, fields], fetchTemplateValues, { immediate: true });

	return { template, templateData, loading, error, fetchTemplateValues };

	async function fetchTemplateValues() {
		if (
			(!primaryKey.value && !isSingleton.value) ||
			primaryKey.value === '+' ||
			!collection.value ||
			fields.value === null
		) {
			itemData.value = null;
			return;
		}

		if (fields.value.length === 0) {
			itemData.value = {};
			return;
		}

		loading.value = true;

		const baseEndpoint = getEndpoint(collection.value.collection);
		const endpoint = primaryKey.value ? `${baseEndpoint}/${encodeURIComponent(primaryKey.value)}` : baseEndpoint;

		try {
			const result = await api.get(endpoint, {
				params: {
					fields: fields.value,
				},
			});

			itemData.value = result.data.data;
		} catch (err) {
			error.value = err;
		} finally {
			loading.value = false;
		}
	}
}
