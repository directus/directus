<template>
	<filter-sidebar-detail
		v-model="layoutState.props.filters"
		:collection="layoutState.props.collection"
		:loading="layoutState.loading"
	/>
	<export-sidebar-detail
		:layout-query="layoutState.props.layoutQuery"
		:filters="layoutState.props.filters"
		:search-query="layoutState.props.searchQuery"
		:collection="layoutState.props.collection"
	/>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent } from 'vue';

import { useLayoutState } from '@/composables/use-layout';

export default defineComponent({
	setup() {
		const { t } = useI18n();

		const layoutState = useLayoutState();

		return { t, layoutState };
	},
});
</script>
