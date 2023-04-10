<template>
	<component
		:is="isSingleton ? 'item-route' : 'collection-route'"
		:collection="collection"
		:bookmark="bookmark"
		:archive="archive"
		v-bind="isSingleton ? { singleton: isSingleton } : {}"
	/>
</template>

<script lang="ts">
import { defineComponent, computed, watch } from 'vue';
import CollectionRoute from './collection.vue';
import ItemRoute from './item.vue';
import { useCollectionsStore } from '@/stores/collections';
import { useRoute } from 'vue-router';
import { useLocalStorage } from '@/composables/use-local-storage';

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
			type: String,
			default: null,
		},
	},
	setup(props) {
		const route = useRoute();

		const { data } = useLocalStorage('last-accessed-collection');

		const collectionsStore = useCollectionsStore();

		const isSingleton = computed(() => {
			const collectionInfo = collectionsStore.getCollection(props.collection);
			return !!collectionInfo?.meta?.singleton === true;
		});

		watch(
			() => route.params,
			(newParams) => {
				if (newParams.collection && data.value !== newParams.collection) {
					data.value = newParams.collection;
				}
			},
			{ immediate: true }
		);

		return { isSingleton };
	},
});
</script>
