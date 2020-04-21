import useCollectionPresetStore from '@/stores/collection-presets';
import { ref, Ref, computed, watch } from '@vue/composition-api';
import { debounce } from 'lodash';

import { Filter } from './types';

export function useCollectionPreset(collection: Ref<string>) {
	const collectionPresetsStore = useCollectionPresetStore();

	const localPreset = ref({
		...collectionPresetsStore.getPresetForCollection(collection.value),
	});

	const savePreset = debounce(async (preset) => {
		await collectionPresetsStore.savePreset(preset);
		localPreset.value = collectionPresetsStore.getPresetForCollection(collection.value);
	}, 450);

	watch(collection, () => {
		localPreset.value = {
			...collectionPresetsStore.getPresetForCollection(collection.value),
		};
	});

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const viewOptions = computed<Record<string, any>>({
		get() {
			return localPreset.value.view_options?.[localPreset.value.view_type] || null;
		},
		set(val) {
			localPreset.value = {
				...localPreset.value,
				view_options: {
					...localPreset.value.view_options,
					[localPreset.value.view_type]: val,
				},
			};
			savePreset(localPreset.value);
		},
	});

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const viewQuery = computed<Record<string, any>>({
		get() {
			return localPreset.value.view_query?.[localPreset.value.view_type] || null;
		},
		set(val) {
			localPreset.value = {
				...localPreset.value,
				view_query: {
					...localPreset.value.view_query,
					[localPreset.value.view_type]: val,
				},
			};
			savePreset(localPreset.value);
		},
	});

	const viewType = computed<string>({
		get() {
			return localPreset.value.view_type || null;
		},
		set(val) {
			localPreset.value = {
				...localPreset.value,
				view_type: val,
			};
			savePreset(localPreset.value);
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
			savePreset(localPreset.value);
		},
	});

	return { viewType, viewOptions, viewQuery, filters };
}
