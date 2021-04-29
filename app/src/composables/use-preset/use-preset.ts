import { usePresetsStore, useUserStore } from '@/stores';
import { ref, Ref, computed, watch } from '@vue/composition-api';
import { debounce, isEqual } from 'lodash';
import { useCollection } from '@/composables/use-collection';

import { Filter, Preset } from '@/types/';

export function usePreset(
	collection: Ref<string>,
	bookmark: Ref<number | null> = ref(null),
	temporary = false
): Record<string, any> {
	const presetsStore = usePresetsStore();
	const userStore = useUserStore();

	const busy = ref(false);

	const { info: collectionInfo } = useCollection(collection);

	const bookmarkExists = computed(() => {
		if (!bookmark.value) return false;
		return !!presetsStore.getBookmark(bookmark.value);
	});

	const localPreset = ref<Partial<Preset>>({});
	initLocalPreset();

	const bookmarkSaved = ref(true);
	const bookmarkIsMine = computed(() => localPreset.value.user === userStore.state.currentUser!.id);

	/**
	 * Saves the preset to the database
	 * @param preset The preset that should be saved
	 */
	const savePreset = async (preset?: Partial<Preset>) => {
		if (temporary) return;
		busy.value = true;

		const updatedValues = await presetsStore.savePreset(preset ? preset : localPreset.value);
		localPreset.value = {
			...localPreset.value,
			id: updatedValues.id,
			user: updatedValues.user,
		};
		bookmarkSaved.value = true;
		busy.value = false;
		return updatedValues;
	};

	const autoSave = debounce(async () => {
		savePreset();
	}, 450);

	/**
	 * If no bookmark is present, save periodically to the DB,
	 * otherwhise update the saved status if changes where made.
	 */
	function handleChanges() {
		if (bookmarkExists.value) {
			const bookmarkInStore = presetsStore.getBookmark(Number(bookmark.value));
			bookmarkSaved.value = isEqual(localPreset.value, bookmarkInStore);
		} else {
			autoSave();
		}
	}

	watch([collection, bookmark], () => {
		initLocalPreset();
	});

	const layoutOptions = computed<Record<string, any>>({
		get() {
			if (!localPreset.value.layout) return null;
			return localPreset.value.layout_options?.[localPreset.value.layout] || null;
		},
		set(val) {
			if (!localPreset.value.layout) return null;

			localPreset.value = {
				...localPreset.value,
				layout_options: {
					...localPreset.value.layout_options,
					[localPreset.value.layout]: val,
				},
			};

			handleChanges();
		},
	});

	const layoutQuery = computed<Record<string, any>>({
		get() {
			if (!localPreset.value.layout) return null;
			return localPreset.value.layout_query?.[localPreset.value.layout] || null;
		},
		set(val) {
			if (!localPreset.value.layout) return null;
			localPreset.value = {
				...localPreset.value,
				layout_query: {
					...localPreset.value.layout_query,
					[localPreset.value.layout]: val,
				},
			};

			handleChanges();
		},
	});

	const layout = computed<string | null>({
		get() {
			return localPreset.value.layout || 'tabular';
		},
		set(val) {
			localPreset.value = {
				...localPreset.value,
				layout: val,
			};

			handleChanges();
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

			handleChanges();
		},
	});

	const refreshInterval = computed<number | null>({
		get() {
			return localPreset.value.refresh_interval || null;
		},
		set(val) {
			localPreset.value = {
				...localPreset.value,
				refresh_interval: val,
			};

			handleChanges();
		},
	});

	const searchQuery = computed<string | null>({
		get() {
			return localPreset.value.search || null;
		},
		set(val) {
			localPreset.value = {
				...localPreset.value,
				search: val,
			};

			handleChanges();
		},
	});

	const bookmarkTitle = computed<string | null>({
		get() {
			return localPreset.value?.bookmark || null;
		},
		set(newTitle: string | null) {
			localPreset.value = {
				...localPreset.value,
				bookmark: newTitle,
			};

			// This'll save immediately
			savePreset();
		},
	});

	return {
		bookmarkExists,
		layout,
		layoutOptions,
		layoutQuery,
		filters,
		searchQuery,
		refreshInterval,
		savePreset,
		saveCurrentAsBookmark,
		bookmarkTitle,
		resetPreset,
		bookmarkSaved,
		bookmarkIsMine,
		busy,
		clearLocalSave,
		localPreset,
	};

	/**
	 * Resets the localPreset to the value that is in the store.
	 */
	function clearLocalSave() {
		const defaultPreset = presetsStore.getBookmark(Number(bookmark.value));
		if (defaultPreset) localPreset.value = { ...defaultPreset };
		bookmarkSaved.value = true;
	}

	async function resetPreset() {
		localPreset.value = {
			...localPreset.value,
			layout_query: null,
			layout_options: null,
			layout: 'tabular',
			filters: null,
			search: null,
			refresh_interval: null,
		};

		await savePreset();
	}

	function initLocalPreset() {
		if (bookmark.value === null) {
			localPreset.value = {
				...presetsStore.getPresetForCollection(collection.value),
			};
		} else {
			if (bookmarkExists.value === false) return;

			localPreset.value = {
				...presetsStore.getBookmark(Number(bookmark.value)),
			};
		}

		if (!localPreset.value.layout) {
			localPreset.value = {
				...localPreset.value,
				layout: 'tabular',
			};
		}

		if (collectionInfo.value?.meta?.archive_field && collectionInfo.value?.meta?.archive_app_filter === true) {
			localPreset.value = {
				...localPreset.value,
				filters: localPreset.value.filters || [
					{
						key: 'hide-archived',
						field: collectionInfo.value.meta.archive_field,
						operator: 'neq',
						value: collectionInfo.value.meta.archive_value!,
						locked: true,
					},
				],
			};
		}
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

		data.user = userStore.state.currentUser!.id;

		return await savePreset(data);
	}
}
