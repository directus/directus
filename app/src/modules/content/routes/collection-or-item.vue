<script setup lang="ts">
import { computed, watch } from 'vue';
import CollectionRoute from './collection.vue';
import ItemRoute from './item.vue';
import { useCollectionsStore } from '@/stores/collections';
import { useRoute } from 'vue-router';
import { useLocalStorage } from '@/composables/use-local-storage';

const props = defineProps<{
	collection: string;
	bookmark?: string;
	archive?: string;
}>();

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
