<template>
	<component
		:is="layoutWrapper"
		v-slot="{ layoutState }"
		v-model:layout-options="layoutOptions"
		v-model:layout-query="layoutQuery"
		v-model:filters="filters"
		v-model:search-query="searchQuery"
		collection="directus_activity"
	>
		<private-view :title="t('activity_feed')">
			<template #title-outer:prepend>
				<v-button class="header-icon" rounded disabled icon secondary>
					<v-icon name="access_time" />
				</v-button>
			</template>

			<template #actions:prepend>
				<component :is="`layout-actions-${layout}`" v-bind="layoutState" />
			</template>

			<template #actions>
				<search-input v-model="searchQuery" />
			</template>

			<template #navigation>
				<activity-navigation v-model:filters="filters" />
			</template>

			<component :is="`layout-${layout}`" v-bind="layoutState" class="layout" />

			<router-view name="detail" :primary-key="primaryKey" />

			<template #sidebar>
				<sidebar-detail icon="info_outline" :title="t('information')" close>
					<div v-md="t('page_help_activity_collection')" class="page-description" />
				</sidebar-detail>
				<layout-sidebar-detail v-model="layout">
					<component :is="`layout-options-${layout}`" v-bind="layoutState" />
				</layout-sidebar-detail>
				<component :is="`layout-sidebar-${layout}`" v-bind="layoutState" />
			</template>
		</private-view>
	</component>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, computed, ref } from 'vue';
import ActivityNavigation from '../components/navigation.vue';
import usePreset from '@/composables/use-preset';
import { useLayout } from '@/composables/use-layout';
import FilterSidebarDetail from '@/views/private/components/filter-sidebar-detail';
import LayoutSidebarDetail from '@/views/private/components/layout-sidebar-detail';
import SearchInput from '@/views/private/components/search-input';

export default defineComponent({
	name: 'ActivityCollection',
	components: { ActivityNavigation, FilterSidebarDetail, LayoutSidebarDetail, SearchInput },
	props: {
		primaryKey: {
			type: String,
			default: null,
		},
	},
	setup() {
		const { t } = useI18n();

		const { layout, layoutOptions, layoutQuery, filters, searchQuery } = usePreset(ref('directus_activity'));
		const { breadcrumb } = useBreadcrumb();

		const { layoutWrapper } = useLayout(layout);

		return { t, breadcrumb, layout, layoutWrapper, layoutOptions, layoutQuery, searchQuery, filters };

		function useBreadcrumb() {
			const breadcrumb = computed(() => {
				return [
					{
						name: t('collection', 2),
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
