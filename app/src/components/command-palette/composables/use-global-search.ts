import { useApi } from '@directus/composables';
import { computed, onBeforeUnmount, type Ref, ref, watch } from 'vue';
import { useCollectionsStore } from '@/stores/collections';
import { useFieldsStore } from '@/stores/fields';
import { useSettingsStore } from '@/stores/settings';
import { renderPlainStringTemplate } from '@/utils/render-string-template';

export interface GlobalSearchResultItem {
	collection: string;
	pk: string;
	displayValue: string;
	descriptionValue: string | null;
	icon: string;
	collectionName: string;
}

export interface GlobalSearchCollectionResult {
	collection: string;
	collectionName: string;
	icon: string;
	items: GlobalSearchResultItem[];
}

export function useGlobalSearch(search: Ref<string>) {
	const api = useApi();
	const settingsStore = useSettingsStore();
	const collectionsStore = useCollectionsStore();
	const fieldsStore = useFieldsStore();

	const results = ref<GlobalSearchCollectionResult[]>([]);
	const loading = ref(false);

	const hasConfig = computed(() => {
		const config = settingsStore.settings?.global_search_config;
		return !!config?.length;
	});

	let searchTimeout: ReturnType<typeof setTimeout> | null = null;
	let requestId = 0;

	watch(search, (value) => {
		if (searchTimeout) clearTimeout(searchTimeout);
		const currentRequest = ++requestId;

		const query = value.trim();

		if (query.length < 2 || !hasConfig.value) {
			results.value = [];
			loading.value = false;
			return;
		}

		loading.value = true;

		searchTimeout = setTimeout(() => {
			fetchResults(query, currentRequest);
		}, 300);
	});

	onBeforeUnmount(() => {
		requestId++;
		if (searchTimeout) clearTimeout(searchTimeout);
	});

	async function fetchResults(query: string, currentRequest: number) {
		try {
			const response = await api.post('/utils/global-search', { query });

			if (currentRequest !== requestId) return;

			const config = settingsStore.settings!.global_search_config!;
			const mapped: GlobalSearchCollectionResult[] = [];

			for (const collectionConfig of config) {
				const coll = collectionConfig.collection;
				const items = response.data.data[coll];

				if (!items?.length) continue;

				const collection = collectionsStore.getCollection(coll);
				const pkField = fieldsStore.getPrimaryKeyFieldForCollection(coll)?.field ?? 'id';
				const icon = (collection?.meta?.icon ?? 'box') as string;
				const collectionName = collection?.name ?? coll;

				const template = collectionConfig.display_template ?? collection?.meta?.display_template ?? `{{${pkField}}}`;

				mapped.push({
					collection: coll,
					collectionName,
					icon,
					items: items.map((item: Record<string, any>) => ({
						collection: coll,
						pk: String(item[pkField]),
						displayValue: renderPlainStringTemplate(template, item) ?? String(item[pkField]),
						descriptionValue: collectionConfig.description_field
							? ((item[collectionConfig.description_field] as string | null) ?? null)
							: null,
						icon,
						collectionName,
					})),
				});
			}

			results.value = mapped;
		} catch {
			if (currentRequest !== requestId) return;
			results.value = [];
		} finally {
			if (currentRequest === requestId) loading.value = false;
		}
	}

	return { results, loading, hasConfig };
}
