<script setup lang="ts">
import { useCollectionsStore } from '@/stores/collections';
import { usePresetsStore } from '@/stores/presets';
import { useUserStore } from '@/stores/user';
import { Collection } from '@/types/collections';
import { getCollectionRoute } from '@/utils/get-route';
import { Preset } from '@directus/types';
import { orderBy } from 'lodash';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import NavigationBookmark from '../../content/components/navigation-bookmark.vue';
import NavigationItemContent from '../../content/components/navigation-item-content.vue';
import { useRoute } from 'vue-router';
import { useGroupable } from '@directus/composables';

const props = defineProps<{
	collection: Collection;
	showHidden?: boolean;
	search?: string;
	active: boolean;
}>();

const { t } = useI18n();
const route = useRoute();

const { isAdmin } = useUserStore();
const collectionsStore = useCollectionsStore();
const presetsStore = usePresetsStore();

const childCollections = computed(() => getChildCollections(props.collection));

const childBookmarks = computed(() => getChildBookmarks(props.collection));

const isGroup = computed(() => childCollections.value.length > 0 || childBookmarks.value.length > 0);

const groupScope = 'v-list';
const groupValue = props.collection.collection;

const { active: isGroupOpen } = useGroupable({
	group: groupScope,
	value: groupValue,
});

const isBookmarkActive = computed(() => 'bookmark' in route.query);

const to = computed(() => (props.collection.schema ? getCollectionRoute(props.collection.collection) : ''));

const matchesSearch = computed(() => {
	if (!props.search || props.search.length < 3) return true;

	const searchQuery = props.search.toLowerCase();

	return matchesSearch(props.collection) || childrenMatchSearch(childCollections.value, childBookmarks.value);

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

const hasContextMenu = computed(() => isAdmin && props.collection.type === 'table');

function getChildCollections(collection: Collection) {
	let collections = collectionsStore.collections.filter(
		(childCollection) => childCollection.meta?.group === collection.collection,
	);

	if (props.showHidden === false) {
		collections = collections.filter((collection) => collection.meta?.hidden !== true);
	}

	return orderBy(collections, ['meta.sort', 'collection']);
}

function getChildBookmarks(collection: Collection) {
	return presetsStore.bookmarks.filter((bookmark) => bookmark.collection === collection.collection);
}
</script>

<template>
	<v-list-group
		v-if="isGroup && matchesSearch"
		v-context-menu="hasContextMenu ? 'contextMenu' : null"
		:to="to"
		:scope="groupScope"
		:value="groupValue"
		:query="isGroupOpen && isBookmarkActive"
		:open="collection.meta?.collapse === 'locked'"
		:arrow-placement="collection.meta?.collapse === 'locked' ? false : 'after'"
		:active="active && !isBookmarkActive"
	>
		<template #activator>
			<navigation-item-content :search="search" :name="t('all_users')" icon="folder_shared" :color="null" />
		</template>
		<navigation-bookmark v-for="bookmark in childBookmarks" :key="bookmark.id" :bookmark="bookmark" />
	</v-list-group>

	<v-list-item
		v-else-if="matchesSearch"
		v-context-menu="hasContextMenu ? 'contextMenu' : null"
		:to="to"
		:value="collection.collection"
		:class="{ hidden: collection.meta?.hidden }"
		:active="active && !isBookmarkActive"
	>
		<navigation-item-content :search="search" :name="t('all_users')" icon="folder_shared" :color="null" />
	</v-list-item>
</template>

<style scoped>
.hidden {
	--v-list-item-color: var(--theme--foreground-subdued);
}
</style>
