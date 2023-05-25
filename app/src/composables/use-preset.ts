import { usePresetsStore } from '@/stores/presets';
import { useUserStore } from '@/stores/user';
import { translate } from '@/utils/translate-literal';
import type { User } from '@directus/types';
import { Filter, Preset } from '@directus/types';
import { assign, debounce, isEqual } from 'lodash';
import { ComputedRef, Ref, computed, ref, watch } from 'vue';

type UsablePreset = {
	bookmarkExists: ComputedRef<boolean>;
	layout: Ref<string | null>;
	layoutOptions: Ref<Record<string, any>>;
	layoutQuery: Ref<Record<string, any>>;
	filter: Ref<Filter | null>;
	search: Ref<string | null>;
	refreshInterval: Ref<number | null>;
	savePreset: (preset?: Partial<Preset> | undefined) => Promise<any>;
	saveCurrentAsBookmark: (overrides: Partial<Preset>) => Promise<any>;
	bookmarkTitle: Ref<string | null>;
	resetPreset: () => Promise<void>;
	bookmarkSaved: Ref<boolean>;
	bookmarkIsMine: ComputedRef<boolean>;
	busy: Ref<boolean>;
	clearLocalSave: () => void;
	localPreset: Ref<Partial<Preset>>;
};

export function usePreset(
	collection: Ref<string>,
	bookmark: Ref<number | null> = ref(null),
	temporary = false
): UsablePreset {
	const presetsStore = usePresetsStore();
	const userStore = useUserStore();

	const busy = ref(false);

	// const { info: collectionInfo } = useCollection(collection);

	const bookmarkExists = computed(() => {
		if (!bookmark.value) return false;
		return !!presetsStore.getBookmark(bookmark.value);
	});

	const localPreset = ref<Partial<Preset>>({});
	initLocalPreset();

	const bookmarkSaved = ref(true);
	const bookmarkIsMine = computed(() => localPreset.value.user === (userStore.currentUser as User).id);

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
	 * otherwise update the saved status if changes where made.
	 */
	function handleChanges() {
		if (bookmarkExists.value) {
			const bookmarkInStore = presetsStore.getBookmark(Number(bookmark.value));
			bookmarkSaved.value = isEqual(localPreset.value, bookmarkInStore);
		} else {
			autoSave();
		}
	}

	function updatePreset(preset: Partial<Preset>, immediate?: boolean) {
		localPreset.value = assign({}, localPreset.value, preset);
		immediate ? savePreset() : handleChanges();
	}

	watch([collection, bookmark], () => {
		initLocalPreset();
	});

	// update current bookmark title when it is edited in navigation-bookmark
	presetsStore.$subscribe(() => {
		if (!bookmarkExists.value) return;
		const newBookmark = presetsStore.getBookmark(Number(bookmark.value));
		localPreset.value.bookmark = newBookmark?.bookmark;
	});

	const layoutOptions = computed<Record<string, any>>({
		get() {
			return localPreset.value.layout_options?.[layout.value] || null;
		},
		set(options) {
			const { layout_options } = localPreset.value;
			updatePreset({ layout_options: assign({}, layout_options, { [layout.value]: options }) });
		},
	});

	const layoutQuery = computed<Record<string, any>>({
		get() {
			return localPreset.value.layout_query?.[layout.value] || null;
		},
		set(query) {
			const { layout_query } = localPreset.value;
			updatePreset({ layout_query: assign({}, layout_query, { [layout.value]: query }) });
		},
	});

	const layout = computed<string>({
		get: () => localPreset.value.layout || 'tabular',
		set: (layout) => updatePreset({ layout }),
	});

	const filter = computed<Filter | null>({
		get: () => localPreset.value.filter ?? null,
		set: (filter) => updatePreset({ filter }),
	});

	const refreshInterval = computed<number | null>({
		get: () => localPreset.value.refresh_interval || null,
		set: (refresh_interval) => updatePreset({ refresh_interval }),
	});

	const search = computed<string | null>({
		get: () => localPreset.value.search || null,
		set: (search) => updatePreset({ search }),
	});

	const bookmarkTitle = computed<string | null>({
		get: () => translate(localPreset.value?.bookmark) || null,
		set: (bookmark) => updatePreset({ bookmark }, true),
	});

	return {
		bookmarkExists,
		layout,
		layoutOptions,
		layoutQuery,
		filter,
		search,
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
		updatePreset(
			{
				layout_query: null,
				layout_options: null,
				layout: 'tabular',
				filter: null,
				search: null,
				refresh_interval: null,
			},
			true
		);
	}

	function initLocalPreset() {
		const preset = { layout: 'tabular' };

		if (bookmark.value === null) {
			assign(preset, presetsStore.getPresetForCollection(collection.value));
		} else if (bookmarkExists.value) {
			assign(preset, presetsStore.getBookmark(Number(bookmark.value)));
		}

		localPreset.value = preset;
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

		data.user = (userStore.currentUser as User).id;

		return await savePreset(data);
	}
}
