<template>
	<private-view :title="$t('insights')">
		<template #title-outer:prepend>
			<v-button rounded disabled icon secondary>
				<v-icon name="dashboard" />
			</v-button>
		</template>

		<template #navigation>
			<insights-navigation />
		</template>

		<template #actions>
			<create-dashboard-dialog v-model="createDialogActive">
				<template #activator="{ on }">
					<v-button
						@click="on"
						rounded
						icon
						v-tooltip.bottom="createAllowed ? $t('create_item') : $t('not_allowed')"
						:disabled="createAllowed === false"
					>
						<v-icon name="add" />
					</v-button>
				</template>
			</create-dashboard-dialog>
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
import { defineComponent, computed, ref } from '@vue/composition-api';
import { useInsightsStore, usePermissionsStore } from '@/stores';
import i18n from '@/lang';
import { Dashboard } from '@/types';
import router from '@/router';
import InsightsNavigation from '../components/navigation.vue';
import CreateDashboardDialog from '../components/create-dashboard-dialog.vue';

export default defineComponent({
	name: 'InsightsOverview',
	components: { InsightsNavigation, CreateDashboardDialog },
	setup() {
		const insightsStore = useInsightsStore();
		const permissionsStore = usePermissionsStore();

		const createDialogActive = ref(false);

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

		return {
			dashboards: insightsStore.state.dashboards,
			createAllowed,
			tableHeaders,
			navigateToDashboard,
			createDialogActive,
		};

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
