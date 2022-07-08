<template>
	<component
		:is="isSingleton ? 'item-route' : 'collection-route'"
		:collection="collection"
		:bookmark="bookmark"
		:singleton="isSingleton ? true : undefined"
		:archive="archive"
	/>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import CollectionRoute from './collection.vue';
import ItemRoute from './item.vue';
import { useCollectionsStore } from '@/stores/';

export default defineComponent({
	components: {
		CollectionRoute,
		ItemRoute,
	},
	props: {
		collection: {
			type: String,
			required: true,
		},
		bookmark: {
			type: String,
			default: null,
		},
		archive: {
			type: Boolean,
			default: false,
		},
	},
	setup(props) {
		const collectionsStore = useCollectionsStore();

		const isSingleton = computed(() => {
			const collectionInfo = collectionsStore.getCollection(props.collection);
			return !!collectionInfo?.meta?.singleton === true;
		});

		return { isSingleton };
	},
});
</script>
