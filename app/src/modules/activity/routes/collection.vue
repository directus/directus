<template>
	<private-view :title="$t('activity_feed')">
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded disabled icon secondary>
				<v-icon name="access_time" />
			</v-button>
		</template>

		<template #actions:prepend>
			<portal-target name="actions:prepend" />
		</template>

		<template #actions>
			<search-input v-model="searchQuery" />
		</template>

		<template #navigation>
			<activity-navigation />
		</template>

		<component
			class="layout"
			:is="`layout-${layout}`"
			collection="directus_activity"
			:layout-options.sync="layoutOptions"
			:layout-query.sync="layoutQuery"
			:filters="_filters"
			:search-query="searchQuery"
			@update:filters="filters = $event"
		/>

		<router-view name="detail" :primary-key="primaryKey" />

		<template #sidebar>
			<sidebar-detail icon="info_outline" :title="$t('information')" close>
				<div class="page-description" v-html="marked($t('page_help_activity_collection'))" />
			</sidebar-detail>
			<layout-sidebar-detail @input="layout = $event" :value="layout" />
			<portal-target name="sidebar" />
		</template>
	</private-view>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from '@vue/composition-api';
import ActivityNavigation from '../components/navigation.vue';
import { i18n } from '@/lang';
import usePreset from '@/composables/use-preset';
import marked from 'marked';
import FilterSidebarDetail from '@/views/private/components/filter-sidebar-detail';
import LayoutSidebarDetail from '@/views/private/components/layout-sidebar-detail';
import SearchInput from '@/views/private/components/search-input';
import { nanoid } from 'nanoid';

type Item = {
	[field: string]: any;
};

export default defineComponent({
	name: 'activity-collection',
	components: { ActivityNavigation, FilterSidebarDetail, LayoutSidebarDetail, SearchInput },
	props: {
		primaryKey: {
			type: String,
			default: null,
		},
		queryFilters: {
			type: Object,
			default: () => ({}),
		},
	},
	setup(props) {
		const { layout, layoutOptions, layoutQuery, filters, searchQuery } = usePreset(ref('directus_activity'));
		const { breadcrumb } = useBreadcrumb();

		const _filters = computed(() => {
			const filtersFormatted = [...filters.value];

			if (props.queryFilters) {
				for (const [key, value] of Object.entries(props.queryFilters)) {
					filtersFormatted.push({
						key: nanoid(),
						locked: true,
						field: key,
						operator: 'eq',
						value: value,
					});
				}
			}

			return filtersFormatted;
		});

		return {
			breadcrumb,
			marked,
			layout,
			layoutOptions,
			layoutQuery,
			filters,
			searchQuery,
			_filters,
		};

		function useBreadcrumb() {
			const breadcrumb = computed(() => {
				return [
					{
						name: i18n.tc('collection', 2),
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
