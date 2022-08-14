import { useCollectionsStore } from '@/stores/collections';
import { Ref, ref, watch } from 'vue';

let showHidden: Ref<boolean>;
let activeGroups: Ref<string[]>;

export function useNavigation(currentCollection: Ref<string | null>) {
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

	watch(
		currentCollection,
		(collectionKey) => {
			if (collectionKey === null) return;

			let collection = collectionsStore.getCollection(collectionKey);

			const collectionsToAdd: string[] = [];

			while (collection?.meta?.group) {
				if (activeGroups.value.includes(collection.meta.group) === false) {
					collectionsToAdd.push(collection.meta.group);
				}

				collection = collectionsStore.getCollection(collection.meta.group);
			}

			activeGroups.value = [...activeGroups.value, ...collectionsToAdd];
		},
		{ immediate: true }
	);

	return { showHidden, activeGroups };
}
