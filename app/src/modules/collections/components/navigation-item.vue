<template>
	<v-list-group
		v-if="isGroup"
		:to="to"
		scope="collections-navigation"
		:value="collection.collection"
		query
		:arrow-placement="collection.meta?.collapse === 'locked' ? false : 'after'"
	>
		<template #activator>
			<navigation-item-content :name="collection.name" :icon="collection.meta?.icon" :color="collection.meta?.color" />
		</template>

		<navigation-item v-for="collection in childCollections" :key="collection.collection" :collection="collection" />
		<navigation-bookmark v-for="bookmark in childBookmarks" :key="bookmark.id" :bookmark="bookmark" />
	</v-list-group>

	<v-list-item v-else :to="to" :value="collection.collection" :class="{ hidden: collection.meta?.hidden }" query>
		<navigation-item-content :name="collection.name" :icon="collection.meta?.icon" :color="collection.meta?.color" />
	</v-list-item>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue';
import { Collection } from '@/types';
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
	},
	setup(props) {
		const collectionsStore = useCollectionsStore();
		const presetsStore = usePresetsStore();

		const childCollections = computed(() => {
			let collections = collectionsStore.collections.filter(
				(collection) => collection.meta?.group === props.collection.collection
			);

			if (props.showHidden === false) {
				collections = collections.filter((collection) => collection.meta?.hidden !== true);
			}

			return collections;
		});

		const childBookmarks = computed(() => {
			return presetsStore.bookmarks.filter((bookmark) => bookmark.collection === props.collection.collection);
		});

		const isGroup = computed(() => childCollections.value.length > 0 || childBookmarks.value.length > 0);

		const to = computed(() => (props.collection.schema ? `/collections/${props.collection.collection}` : ''));

		return { childCollections, childBookmarks, isGroup, to };
	},
});
</script>

<style scoped>
.hidden {
	--v-list-item-color: var(--foreground-subdued);
}
</style>
