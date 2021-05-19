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
import { useI18n } from 'vue-i18n';
import { defineComponent, toRefs } from 'vue';

import { useLayoutState } from '@/composables/use-layout';

export default defineComponent({
	setup() {
		const { t } = useI18n();

		const layoutState = useLayoutState();
		const { props, loading } = toRefs(layoutState.value);

		return { t, props, loading };
	},
});
</script>
