<template>
	<filter-sidebar-detail v-model="props.filters" :collection="props.collection" :loading="loading" />
	<export-sidebar-detail
		:layout-query="props.layoutQuery"
		:filters="props.filters"
		:search-query="props.searchQuery"
		:collection="props.collection"
	/>
</template>

<script lang="ts">
import { defineComponent, toRefs } from 'vue';

import { useLayoutState } from '@directus/shared/composables';

export default defineComponent({
	setup() {
		const layoutState = useLayoutState();
		const { props, loading } = toRefs(layoutState.value);

		return { props, loading };
	},
});
</script>
