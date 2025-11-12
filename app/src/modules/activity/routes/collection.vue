<script setup lang="ts">
import { usePreset } from '@/composables/use-preset';
import LayoutSidebarDetail from '@/views/private/components/layout-sidebar-detail.vue';
import SearchInput from '@/views/private/components/search-input.vue';
import { useLayout } from '@directus/composables';
import { Filter } from '@directus/types';
import { mergeFilters } from '@directus/utils';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import ActivityNavigation from '../components/navigation.vue';

defineProps<{
	primaryKey?: string;
}>();

const { t } = useI18n();

const { layout, layoutOptions, layoutQuery, filter, search } = usePreset(ref('directus_activity'));

const { layoutWrapper } = useLayout(layout);

const roleFilter = ref<Filter | null>(null);
</script>

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
		<private-view :title="t('activity_feed')" icon="access_time">
			<template #actions:prepend>
				<component :is="`layout-actions-${layout}`" v-bind="layoutState" />
			</template>

			<template #actions>
				<search-input v-model="search" v-model:filter="filter" collection="directus_activity" />
			</template>

			<template #navigation>
				<activity-navigation v-model:filter="roleFilter" />
			</template>

			<component :is="`layout-${layout}`" v-bind="layoutState">
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
				<layout-sidebar-detail v-model="layout">
					<component :is="`layout-options-${layout}`" v-bind="layoutState" />
				</layout-sidebar-detail>
				<component :is="`layout-sidebar-${layout}`" v-bind="layoutState" />
			</template>
		</private-view>
	</component>
</template>

<style lang="scss" scoped>
.content {
	padding: var(--content-padding);
}

.header-icon {
	--v-button-color-disabled: var(--theme--foreground);
}
</style>
