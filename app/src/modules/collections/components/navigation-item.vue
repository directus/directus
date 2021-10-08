<template>
	<v-list-group v-if="isGroup" :to="to" scope="collections-navigation" :value="collection.collection">
		<template #activator>
			<navigation-item-content :name="collection.name" :icon="collection.meta?.icon" :color="collection.meta?.color" />
		</template>

		<navigation-item v-for="collection in childCollections" :key="collection.collection" :collection="collection" />
	</v-list-group>

	<v-list-item v-else :to="to">
		<navigation-item-content :name="collection.name" :icon="collection.meta?.icon" :color="collection.meta?.color" />
	</v-list-item>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue';
import { Collection } from '@/types';
import { useCollectionsStore, usePresetsStore } from '@/stores';
import NavigationItemContent from './navigation-item-content.vue';

export default defineComponent({
	name: 'NavigationItem',
	components: { NavigationItemContent },
	props: {
		collection: {
			type: Object as PropType<Collection>,
			required: true,
		},
	},
	setup(props) {
		const collectionsStore = useCollectionsStore();
		const presetsStore = usePresetsStore();

		const childCollections = computed(() => {
			return collectionsStore.visibleCollections.filter(
				(collection) => collection.meta?.group === props.collection.collection
			);
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
