<script setup lang="ts">
import { useLocalStorage } from '@vueuse/core';
import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import CollectionRoute from './collection.vue';
import ItemRoute from './item.vue';
import { useCollectionsStore } from '@/stores/collections';

const props = defineProps<{
	collection: string;
	bookmark?: string;
	archive?: string;
}>();

const route = useRoute();

const lastAccessedCollection = useLocalStorage<string | null>('directus-last-accessed-collection', null);

const collectionsStore = useCollectionsStore();

const isSingleton = computed(() => {
	const collectionInfo = collectionsStore.getCollection(props.collection);
	return !!collectionInfo?.meta?.singleton === true;
});

watch(
	() => route.params,
	(newParams) => {
		if (newParams.collection && lastAccessedCollection.value !== newParams.collection) {
			lastAccessedCollection.value = newParams.collection;
		}
	},
	{ immediate: true },
);
</script>

<template>
	<component
		:is="isSingleton ? ItemRoute : CollectionRoute"
		:collection="collection"
		:bookmark="bookmark"
		:archive="archive"
		v-bind="isSingleton ? { singleton: isSingleton } : {}"
	/>
</template>
