import useCollectionPresetStore from '@/stores/collection-presets';
import { ref, Ref, computed, watch } from '@vue/composition-api';
import { debounce } from 'lodash';

import { Filter, CollectionPreset } from './types';

export function useCollectionPreset(
	collection: Ref<string>,
	bookmark: Ref<number | null> = ref(null)
) {
	const collectionPresetsStore = useCollectionPresetStore();

	const bookmarkExists = computed(() => {
		if (!bookmark.value) return false;

		return !!collectionPresetsStore.state.collectionPresets.find(
			(preset) => preset.id === bookmark.value
		);
	});
	const localPreset = ref<CollectionPreset>({});
	initLocalPreset();

	const savePreset = async () => await collectionPresetsStore.savePreset(localPreset.value);

	const autoSave = debounce(async () => {
		if (!bookmark || bookmark.value === null) {
			savePreset();
		}
	}, 450);

	watch(collection, initLocalPreset);
	watch(bookmark, initLocalPreset);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const viewOptions = computed<Record<string, any>>({
		get() {
			if (!localPreset.value.view_type) return null;
			return localPreset.value.view_options?.[localPreset.value.view_type] || null;
		},
		set(val) {
			if (!localPreset.value.view_type) return null;

			localPreset.value = {
				...localPreset.value,
				view_options: {
					...localPreset.value.view_options,
					[localPreset.value.view_type]: val,
				},
			};

			autoSave();
		},
	});

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const viewQuery = computed<Record<string, any>>({
		get() {
			if (!localPreset.value.view_type) return null;
			return localPreset.value.view_query?.[localPreset.value.view_type] || null;
		},
		set(val) {
			if (!localPreset.value.view_type) return null;
			localPreset.value = {
				...localPreset.value,
				view_query: {
					...localPreset.value.view_query,
					[localPreset.value.view_type]: val,
				},
			};

			autoSave();
		},
	});

	const viewType = computed<string | null>({
		get() {
			return localPreset.value.view_type || null;
		},
		set(val) {
			localPreset.value = {
				...localPreset.value,
				view_type: val,
			};

			autoSave();
		},
	});

	const filters = computed<Filter[]>({
		get() {
			return localPreset.value.filters || [];
		},
		set(val) {
			localPreset.value = {
				...localPreset.value,
				filters: val,
			};

			autoSave();
		},
	});

	const searchQuery = computed<string | null>({
		get() {
			return localPreset.value.search_query || null;
		},
		set(val) {
			localPreset.value = {
				...localPreset.value,
				search_query: val,
			};

			autoSave();
		},
	});

	return { bookmarkExists, viewType, viewOptions, viewQuery, filters, searchQuery, savePreset };

	function initLocalPreset() {
		if (bookmark.value === null) {
			localPreset.value = {
				...collectionPresetsStore.getPresetForCollection(collection.value),
			};
		} else {
			if (bookmarkExists.value === false) return;

			localPreset.value = {
				...collectionPresetsStore.getBookmark(+bookmark.value),
			};
		}
	}
}
