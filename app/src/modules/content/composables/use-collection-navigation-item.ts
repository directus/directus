import { useCollectionsStore } from '@/stores/collections';
import { usePresetsStore } from '@/stores/presets';
import { useUserStore } from '@/stores/user';
import { Collection } from '@/types/collections';
import { getCollectionRoute } from '@/utils/get-route';
import { Preset } from '@directus/types';
import { orderBy } from 'lodash';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

export const useCollectionNavigationItem = (collection: Collection, showHidden?: boolean, search?: string) => {
	const route = useRoute();

	const userStore = useUserStore();
	const collectionsStore = useCollectionsStore();
	const presetsStore = usePresetsStore();

	const childCollections = computed(() => getChildCollections(collection));

	const childBookmarks = computed(() => getChildBookmarks(collection));

	const isGroup = computed(() => childCollections.value.length > 0 || childBookmarks.value.length > 0);

	const isBookmarkActive = computed(() => 'bookmark' in route.query);

	const collectionRoute = computed(() => (collection.schema ? getCollectionRoute(collection.collection) : ''));

	const matchesSearch = computed(() => {
		if (!search || search.length < 3) return true;

		const searchQuery = search.toLowerCase();

		return matchesSearch(collection) || childrenMatchSearch(childCollections.value, childBookmarks.value);

		function childrenMatchSearch(collections: Collection[], bookmarks: Preset[]): boolean {
			return (
				collections.some((collection) => {
					const childCollections = getChildCollections(collection);
					const childBookmarks = getChildBookmarks(collection);

					return matchesSearch(collection) || childrenMatchSearch(childCollections, childBookmarks);
				}) || bookmarks.some((bookmark) => bookmarkMatchesSearch(bookmark))
			);
		}

		function matchesSearch(collection: Collection) {
			return collection.collection.includes(searchQuery) || collection.name.toLowerCase().includes(searchQuery);
		}

		function bookmarkMatchesSearch(bookmark: Preset) {
			return bookmark.bookmark?.toLowerCase().includes(searchQuery);
		}
	});

	const hasContextMenu = computed(() => userStore.isAdmin && collection.type === 'table');

	function getChildCollections(collection: Collection) {
		let collections = collectionsStore.collections.filter(
			(childCollection) => childCollection.meta?.group === collection.collection,
		);

		if (showHidden === false) {
			collections = collections.filter((collection) => collection.meta?.hidden !== true);
		}

		return orderBy(collections, ['meta.sort', 'collection']);
	}

	function getChildBookmarks(collection: Collection) {
		return presetsStore.bookmarks.filter((bookmark) => bookmark.collection === collection.collection);
	}

	return {
		isGroup,
		isBookmarkActive,
		collectionRoute,
		matchesSearch,
		hasContextMenu,
		childBookmarks,
		childCollections,
	};
};
