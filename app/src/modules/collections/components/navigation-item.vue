<template>
	<v-list-group
		v-if="isGroup && matchesSearch"
		:to="to"
		scope="collections-navigation"
		:value="collection.collection"
		query
		:arrow-placement="collection.meta?.collapse === 'locked' ? false : 'after'"
	>
		<template #activator>
			<navigation-item-content
				:search="search"
				:name="collection.name"
				:icon="collection.meta?.icon"
				:color="collection.meta?.color"
			/>
		</template>

		<navigation-item
			v-for="collection in childCollections"
			:key="collection.collection"
			:collection="collection"
			:search="search"
		/>
		<navigation-bookmark v-for="bookmark in childBookmarks" :key="bookmark.id" :bookmark="bookmark" />
	</v-list-group>

	<v-list-item
		v-else-if="matchesSearch"
		:to="to"
		:value="collection.collection"
		:class="{ hidden: collection.meta?.hidden }"
		query
	>
		<navigation-item-content
			:search="search"
			:name="collection.name"
			:icon="collection.meta?.icon"
			:color="collection.meta?.color"
		/>
	</v-list-item>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue';
import { Collection } from '@/types';
import { Preset } from '@directus/shared/types';
import { useCollectionsStore, usePresetsStore } from '@/stores';
import NavigationItemContent from './navigation-item-content.vue';
import NavigationBookmark from './navigation-bookmark.vue';

export default defineComponent({
	name: 'NavigationItem',
	components: { NavigationItemContent, NavigationBookmark },
	props: {
		collection: {
			type: Object as PropType<Collection>,
			required: true,
		},
		showHidden: {
			type: Boolean,
			default: false,
		},
		search: {
			type: String,
			default: null,
		},
	},
	setup(props) {
		const collectionsStore = useCollectionsStore();
		const presetsStore = usePresetsStore();

		const childCollections = computed(() => getChildCollections(props.collection));

		const childBookmarks = computed(() => getChildBookmarks(props.collection));

		const isGroup = computed(() => childCollections.value.length > 0 || childBookmarks.value.length > 0);

		const to = computed(() => (props.collection.schema ? `/collections/${props.collection.collection}` : ''));

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

		return { childCollections, childBookmarks, isGroup, to, matchesSearch };

		function getChildCollections(collection: Collection) {
			let collections = collectionsStore.collections.filter(
				(childCollection) => childCollection.meta?.group === collection.collection
			);

			if (props.showHidden === false) {
				collections = collections.filter((collection) => collection.meta?.hidden !== true);
			}

			return collections;
		}

		function getChildBookmarks(collection: Collection) {
			return presetsStore.bookmarks.filter((bookmark) => bookmark.collection === collection.collection);
		}
	},
});
</script>

<style scoped>
.hidden {
	--v-list-item-color: var(--foreground-subdued);
}
</style>
