import { isSystemCollection } from '@directus/system-data';
import { orderBy } from 'lodash';
import type { MaybeRefOrGetter } from 'vue';
import { computed, toValue } from 'vue';
import { useCollectionsStore } from '@/stores/collections';
import { Collection } from '@/types/collections';

export interface UseCollectionsOptions {
	excludeCollections: MaybeRefOrGetter<string[]>;
}

export const useCollections = (options: UseCollectionsOptions) => {
	const collectionsStore = useCollectionsStore();

	const availableCollections = computed(() => {
		return orderBy(
			collectionsStore.databaseCollections.filter((collection) => collection.meta).map(disableSelectedCollection),
			['collection'],
		);
	});

	const systemCollections = computed(() =>
		orderBy(
			collectionsStore.collections
				.filter(({ collection }) => isSystemCollection(collection))
				.map(disableSelectedCollection),
			['collection'],
		),
	);

	const displayItems = computed(() => {
		const items: any[] = [...availableCollections.value];

		// Don't use a separate group for system collections, since the v-select search does not open groups,
		// so the experience is rather unpleasant

		if (availableCollections.value.length > 0 && systemCollections.value.length > 0) {
			items.push({ divider: true });
		}

		items.push(...systemCollections.value);

		return items;
	});

	function disableSelectedCollection(collection: Collection) {
		const excludeCollections = toValue(options.excludeCollections);

		return {
			...collection,
			disabled: excludeCollections.includes(collection.collection) ?? false,
		};
	}

	return { displayItems, availableCollections, systemCollections, disableSelectedCollection };
};
