<template>
	<v-list-group
		v-if="isGroup && matchesSearch"
		v-context-menu="'contextMenu'"
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
				:icon="collection.meta?.icon"
				:color="collection.meta?.color"
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
			:icon="collection.meta?.icon"
			:color="collection.meta?.color"
		/>
	</v-list-item>

	<v-menu v-if="hasContextMenu" ref="contextMenu" show-arrow placement="bottom-start">
		<v-list>
			<v-list-item v-if="isAdmin" clickable :to="`/settings/data-model/${collection.collection}`">
				<v-list-item-icon>
					<v-icon name="list_alt" />
				</v-list-item-icon>
				<v-list-item-content>
					<v-text-overflow :text="t('edit_collection')" />
				</v-list-item-content>
			</v-list-item>
		</v-list>
	</v-menu>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue';
import { Collection } from '@/types/collections';
import { Preset } from '@directus/shared/types';
import { useUserStore } from '@/stores/user';
import { useCollectionsStore } from '@/stores/collections';
import { usePresetsStore } from '@/stores/presets';
import NavigationItemContent from './navigation-item-content.vue';
import NavigationBookmark from './navigation-bookmark.vue';
import { useI18n } from 'vue-i18n';
import { orderBy } from 'lodash';

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
		const { t } = useI18n();

		const { isAdmin } = useUserStore();
		const collectionsStore = useCollectionsStore();
		const presetsStore = usePresetsStore();

		const childCollections = computed(() => getChildCollections(props.collection));

		const childBookmarks = computed(() => getChildBookmarks(props.collection));

		const isGroup = computed(() => childCollections.value.length > 0 || childBookmarks.value.length > 0);

		const to = computed(() => (props.collection.schema ? `/content/${props.collection.collection}` : ''));

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

		const hasContextMenu = computed(() => isAdmin);

		return {
			childCollections,
			childBookmarks,
			isGroup,
			to,
			matchesSearch,
			isAdmin,
			t,
			hasContextMenu,
		};

		function getChildCollections(collection: Collection) {
			let collections = collectionsStore.collections.filter(
				(childCollection) => childCollection.meta?.group === collection.collection
			);

			if (props.showHidden === false) {
				collections = collections.filter((collection) => collection.meta?.hidden !== true);
			}

			return orderBy(collections, ['meta.sort', 'collection']);
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
