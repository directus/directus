import { useCollectionsStore } from '@/stores/';
import { Ref, ref } from 'vue';

let showHidden: Ref<boolean>;
let activeGroups: Ref<string[]>;

export function useNavigation() {
	const collectionsStore = useCollectionsStore();

	if (!activeGroups) {
		activeGroups = ref(
			collectionsStore.collections
				.filter((collection) => collection.meta?.collapse === 'open' || collection.meta?.collapse === 'locked')
				.map(({ collection }) => collection)
		);
	}

	if (showHidden === undefined) {
		showHidden = ref(false);
	}

	return { showHidden, activeGroups };
}
