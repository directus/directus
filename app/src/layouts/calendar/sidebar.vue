<template>
	<filter-sidebar-detail v-model="props.filters" :collection="props.collection" :loading="loading" />
	<export-sidebar-detail
		:filters="filtersWithCalendarView"
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
		const { props, loading, filtersWithCalendarView } = toRefs(layoutState.value);

		return { props, loading, filtersWithCalendarView };
	},
});
</script>
