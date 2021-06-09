<template>
	<private-view :title="t('activity_feed')">
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded disabled icon secondary>
				<v-icon name="access_time" />
			</v-button>
		</template>

		<template #actions:prepend>
			<component :is="`layout-actions-${layout}`" />
		</template>

		<template #actions>
			<search-input v-model="searchQuery" />
		</template>

		<template #navigation>
			<activity-navigation v-model:filters="filters" />
		</template>

		<component class="layout" :is="`layout-${layout}`" />

		<router-view name="detail" :primary-key="primaryKey" />

		<template #sidebar>
			<sidebar-detail icon="info_outline" :title="t('information')" close>
				<div class="page-description" v-html="md(t('page_help_activity_collection'))" />
			</sidebar-detail>
			<layout-sidebar-detail v-model="layout" />
			<component :is="`layout-sidebar-${layout}`" />
		</template>
	</private-view>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, computed, ref, reactive } from 'vue';
import ActivityNavigation from '../components/navigation.vue';
import usePreset from '@/composables/use-preset';
import { useLayout } from '@/composables/use-layout';
import { md } from '@/utils/md';
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
		const { t } = useI18n();

		const { layout, layoutOptions, layoutQuery, filters, searchQuery } = usePreset(ref('directus_activity'));
		const { breadcrumb } = useBreadcrumb();

		useLayout(
			layout,
			reactive({
				collection: 'directus_activity',
				selection: [],
				layoutOptions,
				layoutQuery,
				filters,
				searchQuery,
				selectMode: false,
				readonly: false,
			})
		);

		return { t, breadcrumb, md, layout, layoutOptions, layoutQuery, searchQuery, filters };

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
