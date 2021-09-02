<template>
	<filter-sidebar-detail v-model="filtersWritable" :collection="collection" :loading="loading" />
	<export-sidebar-detail
		:layout-query="layoutQuery"
		:filters="filters"
		:search-query="searchQuery"
		:collection="collection"
	/>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import useSync from '@/composables/use-sync';
import { AppFilter } from '@directus/shared/types';
import { LayoutQuery } from './types';

export default defineComponent({
	inheritAttrs: false,
	props: {
		collection: {
			type: String,
			required: true,
		},
		layoutQuery: {
			type: Object as PropType<LayoutQuery>,
			default: () => ({}),
		},
		filters: {
			type: Array as PropType<AppFilter[]>,
			default: () => [],
		},
		searchQuery: {
			type: String as PropType<string | null>,
			default: null,
		},
		loading: {
			type: Boolean,
			required: true,
		},
	},
	emits: ['update:filters'],
	setup(props, { emit }) {
		const filtersWritable = useSync(props, 'filters', emit);

		return { filtersWritable };
	},
});
</script>
