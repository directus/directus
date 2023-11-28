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
import NavigationBookmark from './navigation-bookmark.vue';
import NavigationItemContent from './navigation-item-content.vue';

const props = defineProps<{
	collection: Collection;
	showHidden?: boolean;
	search?: string;
}>();

const { t } = useI18n();

const { isAdmin } = useUserStore();
const collectionsStore = useCollectionsStore();
const presetsStore = usePresetsStore();

const childCollections = computed(() => getChildCollections(props.collection));

const childBookmarks = computed(() => getChildBookmarks(props.collection));

const isGroup = computed(() => childCollections.value.length > 0 || childBookmarks.value.length > 0);

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
		scope="content-navigation"
		:value="collection.collection"
		query
		:open="collection.meta?.collapse === 'locked'"
		:arrow-placement="collection.meta?.collapse === 'locked' ? false : 'after'"
	>
		<template #activator>
			<navigation-item-content
				:search="search"
				:name="collection.name"
				:icon="collection.icon"
				:color="collection.color"
			/>
		</template>
		<navigation-item
			v-for="childCollection in childCollections"
			:key="childCollection.collection"
			:show-hidden="showHidden"
			:collection="childCollection"
			:search="search"
		/>
		<navigation-bookmark v-for="bookmark in childBookmarks" :key="bookmark.id" :bookmark="bookmark" />
	</v-list-group>

	<v-list-item
		v-else-if="matchesSearch"
		v-context-menu="hasContextMenu ? 'contextMenu' : null"
		:to="to"
		:value="collection.collection"
		:class="{ hidden: collection.meta?.hidden }"
		query
	>
		<navigation-item-content
			:search="search"
			:name="collection.name"
			:icon="collection.icon"
			:color="collection.color"
		/>
	</v-list-item>

	<v-menu v-if="hasContextMenu" ref="contextMenu" show-arrow placement="bottom-start">
		<v-list>
			<v-list-item v-if="isAdmin" clickable :to="`/settings/data-model/${collection.collection}`">
				<v-list-item-icon>
					<v-icon name="database" />
				</v-list-item-icon>
				<v-list-item-content>
					<v-text-overflow :text="t('edit_collection')" />
				</v-list-item-content>
			</v-list-item>
		</v-list>
	</v-menu>
</template>

<style scoped>
.hidden {
	--v-list-item-color: var(--theme--foreground-subdued);
}
</style>
