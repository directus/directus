import api from '@/api';
import { useCollectionsStore } from '@/stores';
import { Collection } from '@/types';
import { getFieldsFromTemplate } from '@/utils/get-fields-from-template';
import { computed, Ref, ref, watch } from '@vue/composition-api';
import { get, has, set } from 'lodash';

export default function useTemplate(
	collection: Ref<string>,
	primaryKey: Ref<string>,
	prepend: Ref<Record<string, any> | null> = ref({}),
	append: Ref<Record<string, any> | null> = ref({})
) {
	const _templateItem = ref<Record<string, any>>({});
	const loading = ref(false);
	const error = ref(null);
	const collectionsStore = useCollectionsStore();

	const collectionInfo = computed(() => collectionsStore.getCollection(collection.value));

	const fields = computed(() => {
		const template = collectionInfo.value?.meta?.display_template;
		if (!template) return [];
		return getFieldsFromTemplate(template);
	});

	watch([collection, primaryKey], fetchTemplateValues, { immediate: true });

	const templateItem = computed(() => {
		const finalItem = {};

		for (let field of fields.value) {
			[prepend.value, _templateItem.value, append.value].forEach((item) => {
				if (item && has(item, field)) set(finalItem, field, get(item, field));
			});
		}
		return finalItem;
	});

	return { templateItem };

	async function fetchTemplateValues() {
		if (!primaryKey.value || primaryKey.value === '+') return;
		loading.value = true;

		const endpoint = collection.value.startsWith('directus_')
			? `/${collection.value.substring(9)}/${primaryKey.value}`
			: `/items/${collection.value}/${primaryKey.value}`;

		try {
			const result = await api.get(endpoint, {
				params: {
					fields: fields.value,
				},
			});
			_templateItem.value = result.data.data;
		} catch (err) {
			error.value = err;
		} finally {
			loading.value = false;
		}
	}
}
