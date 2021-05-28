<template>
	<component
		ref="component"
		:bookmark="bookmark"
		:is="isSingleton ? 'item-route' : 'collection-route'"
		:collection="collection"
		:singleton="isSingleton"
	/>
</template>

<script lang="ts">
import { defineComponent, ref, computed, ComponentPublicInstance } from 'vue';
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
	},
	setup(props) {
		const collectionsStore = useCollectionsStore();
		const component = ref<ComponentPublicInstance>();

		const isSingleton = computed(() => {
			const collectionInfo = collectionsStore.getCollection(props.collection);
			return !!collectionInfo?.meta?.singleton === true;
		});

		return { component, isSingleton };
	},
	beforeRouteLeave(to, from) {
		if ((this as any).$refs?.component?.navigationGuard) {
			return (this as any).$refs.component.navigationGuard(to, from);
		}
	},
	beforeRouteUpdate(to, from) {
		if ((this as any).$refs?.component?.navigationGuard) {
			return (this as any).$refs.component.navigationGuard(to, from);
		}
	},
});
</script>
