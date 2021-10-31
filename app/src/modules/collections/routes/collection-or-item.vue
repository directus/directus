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
import { useRouter } from 'vue-router';
import CollectionRoute from './collection.vue';
import ItemRoute from './item.vue';
import { useCollectionsStore } from '@/stores/';
import useShortcut from '@/composables/use-shortcut';

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
		const router = useRouter();

		const isSingleton = computed(() => {
			const collectionInfo = collectionsStore.getCollection(props.collection);
			return !!collectionInfo?.meta?.singleton === true;
		});

		useShortcut('alt+n', createNew);

		return { isSingleton };

		function createNew() {
			router.push(`/collections/${props.collection}/+`);
		}
	},
});
</script>
