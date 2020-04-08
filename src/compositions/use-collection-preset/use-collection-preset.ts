import useCollectionPresetStore from '@/stores/collection-presets';
import { ref, Ref, computed, watch } from '@vue/composition-api';
import { debounce } from 'lodash';

export function useCollectionPreset(collection: Ref<string>) {
	const collectionPresetsStore = useCollectionPresetStore();

	const savePreset = debounce(collectionPresetsStore.savePreset, 450);
	const localPreset = ref({
		...collectionPresetsStore.getPresetForCollection(collection.value),
	});

	watch(collection, () => {
		localPreset.value = {
			...collectionPresetsStore.getPresetForCollection(collection.value),
		};
	});

	const viewOptions = computed({
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

	const viewQuery = computed({
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

	return { viewOptions, viewQuery };
}
