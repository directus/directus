<template>
	<private-view :title="$t('insights')">
		<template #title-outer:prepend>
			<v-button rounded disabled icon secondary>
				<v-icon name="dashboard" />
			</v-button>
		</template>

		<v-table
			v-if="dashboards.length > 0"
			:headers.sync="tableHeaders"
			:items="dashboards"
			show-resize
			fixed-header
			@click:row="navigateToDashboard"
		>
			<template #item.icon="{ item }">
				<v-icon class="icon" :name="item.icon" />
			</template>
		</v-table>

		<v-info icon="dashboard" :title="$t('no_dashboards')" v-else center>
			{{ $t('no_dashboards_copy') }}
		</v-info>
	</private-view>
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';
import { useInsightsStore, usePermissionsStore } from '@/stores';
import i18n from '@/lang';
import { Dashboard } from '@/types';
import router from '@/router';

export default defineComponent({
	name: 'InsightsOverview',
	setup() {
		const insightsStore = useInsightsStore();
		const permissionsStore = usePermissionsStore();

		const createAllowed = computed<boolean>(() => {
			return permissionsStore.hasPermission('directus_dashboards', 'create');
		});

		const tableHeaders = [
			{
				text: '',
				value: 'icon',
				width: 42,
				sortable: false,
			},
			{
				text: i18n.t('name'),
				value: 'name',
				width: 240,
			},
			{
				text: i18n.t('note'),
				value: 'note',
				width: 360,
			},
		];

		return { dashboards: insightsStore.state.dashboards, createAllowed, tableHeaders, navigateToDashboard };

		function navigateToDashboard(dashboard: Dashboard) {
			router.push(`/insights/${dashboard.id}`);
		}
	},
});
</script>

<style scoped>
.v-table {
	padding: var(--content-padding);
	padding-top: 0;
}
</style>
