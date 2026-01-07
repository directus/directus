<script setup lang="ts">
import { useGroupable } from '@directus/composables';
import { Preset } from '@directus/types';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import NavigationBookmark from './navigation-bookmark.vue';
import NavigationItemContent from './navigation-item-content.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VListGroup from '@/components/v-list-group.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VMenu from '@/components/v-menu.vue';
import VTextOverflow from '@/components/v-text-overflow.vue';
import { useCollectionsStore } from '@/stores/collections';
import { usePresetsStore } from '@/stores/presets';
import { useUserStore } from '@/stores/user';
import { Collection } from '@/types/collections';
import { getCollectionRoute } from '@/utils/get-route';

const props = defineProps<{
	collection: Collection;
	showHidden?: boolean;
	search?: string;
}>();

const route = useRoute();

const { isAdmin } = useUserStore();
const collectionsStore = useCollectionsStore();
const presetsStore = usePresetsStore();

const childCollections = computed(() => getChildCollections(props.collection));

const childBookmarks = computed(() => getChildBookmarks(props.collection));

const isGroup = computed(() => childCollections.value.length > 0 || childBookmarks.value.length > 0);

const groupScope = 'content-navigation';
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
	let collections = collectionsStore.sortedCollections.filter(
		(childCollection) => childCollection.meta?.group === collection.collection,
	);

	if (props.showHidden === false) {
		collections = collections.filter((collection) => collection.meta?.hidden !== true);
	}

	return collections;
}

function getChildBookmarks(collection: Collection) {
	return presetsStore.bookmarks.filter((bookmark) => bookmark.collection === collection.collection);
}
</script>

<template>
	<VListGroup
		v-if="isGroup && matchesSearch"
		v-context-menu="hasContextMenu ? 'contextMenu' : null"
		:to="to"
		:scope="groupScope"
		:value="groupValue"
		:query="isGroupOpen && isBookmarkActive"
		:open="collection.meta?.collapse === 'locked'"
		:arrow-placement="collection.meta?.collapse === 'locked' ? false : 'after'"
	>
		<template #activator>
			<NavigationItemContent
				:search="search"
				:name="collection.name"
				:icon="collection.icon"
				:color="collection.color"
			/>
		</template>
		<NavigationItem
			v-for="childCollection in childCollections"
			:key="childCollection.collection"
			:show-hidden="showHidden"
			:collection="childCollection"
			:search="search"
		/>
		<NavigationBookmark v-for="bookmark in childBookmarks" :key="bookmark.id" :bookmark="bookmark" />
	</VListGroup>

	<VListItem
		v-else-if="matchesSearch"
		v-context-menu="hasContextMenu ? 'contextMenu' : null"
		:to="to"
		:value="collection.collection"
		:class="{ hidden: collection.meta?.hidden }"
	>
		<NavigationItemContent :search="search" :name="collection.name" :icon="collection.icon" :color="collection.color" />
	</VListItem>

	<VMenu v-if="hasContextMenu" ref="contextMenu" show-arrow placement="bottom-start">
		<VList>
			<VListItem v-if="isAdmin" clickable :to="`/settings/data-model/${collection.collection}`">
				<VListItemIcon>
					<VIcon name="database" />
				</VListItemIcon>
				<VListItemContent>
					<VTextOverflow :text="$t('edit_collection')" />
				</VListItemContent>
			</VListItem>
		</VList>
	</VMenu>
</template>

<style scoped>
.hidden {
	--v-list-item-color: var(--theme--foreground-subdued);
}
</style>
