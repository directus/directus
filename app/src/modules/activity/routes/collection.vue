<template>
	<private-view :title="$t('activity_feed')">
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded disabled icon secondary>
				<v-icon name="access_time" />
			</v-button>
		</template>

		<template #actions:prepend>
			<div id="target-actions:prepend"></div>
		</template>

		<template #actions>
			<search-input v-model="searchQuery" />
		</template>

		<template #navigation>
			<activity-navigation v-model:filters="filters" />
		</template>

		<component
			class="layout"
			:is="`layout-${layout}`"
			collection="directus_activity"
			v-model:layout-options="layoutOptions"
			v-model:layout-query="layoutQuery"
			v-model:filters="filters"
			:search-query="searchQuery"
		/>

		<router-view name="detail" :primary-key="primaryKey" />

		<template #sidebar>
			<sidebar-detail icon="info_outline" :title="$t('information')" close>
				<div class="page-description" v-html="marked($t('page_help_activity_collection'))" />
			</sidebar-detail>
			<layout-sidebar-detail @input="layout = $event" :value="layout" />
			<div id="target-sidebar"></div>
		</template>
	</private-view>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from 'vue';
import ActivityNavigation from '../components/navigation.vue';
import { i18n } from '@/lang';
import usePreset from '@/composables/use-preset';
import marked from 'marked';
import FilterSidebarDetail from '@/views/private/components/filter-sidebar-detail';
import LayoutSidebarDetail from '@/views/private/components/layout-sidebar-detail';
import SearchInput from '@/views/private/components/search-input';

export default defineComponent({
	name: 'activity-collection',
	components: { ActivityNavigation, FilterSidebarDetail, LayoutSidebarDetail, SearchInput },
	props: {
		primaryKey: {
			type: String,
			default: null,
		},
	},
	setup() {
		const { layout, layoutOptions, layoutQuery, filters, searchQuery } = usePreset(ref('directus_activity'));
		const { breadcrumb } = useBreadcrumb();

		return {
			breadcrumb,
			marked,
			layout,
			layoutOptions,
			layoutQuery,
			searchQuery,
			filters,
		};

		function useBreadcrumb() {
			const breadcrumb = computed(() => {
				return [
					{
						name: i18n.global.t('collection', 2),
						to: `/collections`,
					},
				];
			});

			return { breadcrumb };
		}
	},
});
</script>

<style lang="scss" scoped>
.content {
	padding: var(--content-padding);
}

.header-icon {
	--v-button-color-disabled: var(--foreground-normal);
}
</style>
