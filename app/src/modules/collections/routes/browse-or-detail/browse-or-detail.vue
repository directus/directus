<template>
	<component ref="component" :is="isSingle ? 'collections-detail' : 'collections-browse'" :collection="collection" />
</template>

<script lang="ts">
import { defineComponent, ref, computed } from '@vue/composition-api';
import Vue from 'vue';
import CollectionsBrowse from '../browse';
import CollectionsDetail from '../detail';
import { useCollectionsStore } from '@/stores/';

export default defineComponent({
	components: {
		CollectionsBrowse,
		CollectionsDetail,
	},
	props: {
		collection: {
			type: String,
			required: true,
		},
	},
	setup(props) {
		const collectionsStore = useCollectionsStore();
		const component = ref<Vue>();

		const isSingle = computed(() => {
			const collectionInfo = collectionsStore.getCollection(props.collection);
			return !!collectionInfo?.meta?.single === true;
		});

		return { component, isSingle };
	},
	beforeRouteLeave(to, from, next) {
		if ((this as any).$refs?.component?.navigationGuard) {
			return (this as any).$refs.component.navigationGuard(to, from, next);
		}

		return next();
	},
	beforeRouteUpdate(to, from, next) {
		if ((this as any).$refs?.component?.navigationGuard) {
			return (this as any).$refs.component.navigationGuard(to, from, next);
		}

		return next();
	},
});
</script>
