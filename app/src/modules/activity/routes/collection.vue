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
			<activity-navigation :filters.sync="filters" />
		</template>

		<component
			class="layout"
			:is="`layout-${layout}`"
			collection="directus_activity"
			:layout-options.sync="layoutOptions"
			:layout-query.sync="layoutQuery"
			:filters.sync="filters"
			:search-query="searchQuery"
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
import { cloneDeep } from 'lodash';

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
	},
	setup(props) {
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
