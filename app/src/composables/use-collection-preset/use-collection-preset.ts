import { usePresetsStore, useUserStore } from '@/stores';
import { ref, Ref, computed, watch } from '@vue/composition-api';
import { debounce } from 'lodash';

import { Filter, Preset } from '@/types/';

export function usePreset(collection: Ref<string>, bookmark: Ref<number | null> = ref(null)) {
	const presetsStore = usePresetsStore();
	const userStore = useUserStore();

	const bookmarkExists = computed(() => {
		if (!bookmark.value) return false;

		return !!presetsStore.state.collectionPresets.find((preset) => preset.id === bookmark.value);
	});

	const localPreset = ref<Partial<Preset>>({});
	initLocalPreset();

	const savePreset = async (preset?: Partial<Preset>) => {
		const updatedValues = await presetsStore.savePreset(preset ? preset : localPreset.value);

		localPreset.value.id = updatedValues.id;

		return updatedValues;
	};

	const autoSave = debounce(async () => {
		if (!bookmark || bookmark.value === null) {
			savePreset();
		}
	}, 450);

	watch([collection, bookmark], () => {
		initLocalPreset();
	});

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
			return localPreset.value.view_type || 'tabular';
		},
		set(val) {
			localPreset.value = {
				...localPreset.value,
				view_type: val,
			};

			autoSave();
		},
	});

	const filters = computed({
		get() {
			return localPreset.value.filters || [];
		},
		set(val: readonly Filter[]) {
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

	const title = computed<string | null>({
		get() {
			return localPreset.value?.title || null;
		},
		set(newTitle: string | null) {
			localPreset.value = {
				...localPreset.value,
				title: newTitle,
			};

			// This'll save immediately
			savePreset();
		},
	});

	return {
		bookmarkExists,
		viewType,
		viewOptions,
		viewQuery,
		filters,
		searchQuery,
		savePreset,
		saveCurrentAsBookmark,
		title,
	};

	function initLocalPreset() {
		if (bookmark.value === null) {
			localPreset.value = {
				...presetsStore.getPresetForCollection(collection.value),
			};
		} else {
			if (bookmarkExists.value === false) return;

			localPreset.value = {
				...presetsStore.getBookmark(+bookmark.value),
			};
		}

		if (!localPreset.value.view_type)
			localPreset.value = {
				...localPreset.value,
				view_type: 'tabular',
			};
	}

	/**
	 * Saves the current state of localPreset as a bookmark. The parameter allows you to override
	 * any of the values of the collection preset on save.
	 *
	 * This will set the user of the bookmark to the current user, and is therefore only meant to be
	 * used to create bookmarks for yourself.
	 *
	 * @param overrides Individual overrides for the collection preset
	 */
	async function saveCurrentAsBookmark(overrides: Partial<Preset>) {
		const data = {
			...localPreset.value,
			...overrides,
		};

		if (data.id) delete data.id;

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		data.user = userStore.state.currentUser!.id;

		return await savePreset(data);
	}
}
