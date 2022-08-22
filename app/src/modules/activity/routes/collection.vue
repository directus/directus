<template>
	<component
		:is="layoutWrapper"
		v-slot="{ layoutState }"
		v-model:layout-options="layoutOptions"
		v-model:layout-query="layoutQuery"
		:filter="mergeFilters(filter, roleFilter)"
		:filter-user="filter"
		:filter-system="roleFilter"
		:search="search"
		show-select="none"
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
				<search-input v-model="search" v-model:filter="filter" collection="directus_activity" />
			</template>

			<template #navigation>
				<activity-navigation v-model:filter="roleFilter" />
			</template>

			<component :is="`layout-${layout}`" v-bind="layoutState" class="layout">
				<template #no-results>
					<v-info :title="t('no_results')" icon="search" center>
						{{ t('no_results_copy') }}
					</v-info>
				</template>

				<template #no-items>
					<v-info :title="t('item_count', 0)" icon="access_time" center>
						{{ t('no_items_copy') }}
					</v-info>
				</template>
			</component>

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
import { usePreset } from '@/composables/use-preset';
import { useLayout } from '@directus/shared/composables';
import LayoutSidebarDetail from '@/views/private/components/layout-sidebar-detail.vue';
import SearchInput from '@/views/private/components/search-input.vue';
import { Filter } from '@directus/shared/types';
import { mergeFilters } from '@directus/shared/utils';

export default defineComponent({
	name: 'ActivityCollection',
	components: { ActivityNavigation, LayoutSidebarDetail, SearchInput },
	props: {
		primaryKey: {
			type: String,
			default: null,
		},
	},
	setup() {
		const { t } = useI18n();

		const { layout, layoutOptions, layoutQuery, filter, search } = usePreset(ref('directus_activity'));
		const { breadcrumb } = useBreadcrumb();

		const { layoutWrapper } = useLayout(layout);

		const roleFilter = ref<Filter | null>(null);

		return {
			t,
			breadcrumb,
			layout,
			layoutWrapper,
			layoutOptions,
			layoutQuery,
			search,
			filter,
			roleFilter,
			mergeFilters,
		};

		function useBreadcrumb() {
			const breadcrumb = computed(() => {
				return [
					{
						name: t('collection', 2),
						to: `/content`,
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
