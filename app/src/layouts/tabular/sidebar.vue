<template>
	<filter-sidebar-detail v-model="props.filters" :collection="props.collection" :loading="loading" />
	<export-sidebar-detail
		:layout-query="props.layoutQuery"
		:filters="props.filters"
		:search-query="props.searchQuery"
		:collection="props.collection"
		:selection="props.selection"
		:allItemsSelected="allItemsSelected"
	/>
</template>

<script lang="ts">
import { defineComponent, toRefs, computed } from 'vue';
import { useLayoutState } from '@directus/shared/composables';

export default defineComponent({
	setup() {
		const layoutState = useLayoutState();
		const { props, table, loading } = toRefs(layoutState.value);
		const allItemsSelected = useAllItemsSelected();
		return { props, loading, allItemsSelected };

		function useAllItemsSelected() {
			const allItemsSelected = computed(() => table.value?.allItemsSelected);
			return allItemsSelected;
		}
	},
});
</script>
