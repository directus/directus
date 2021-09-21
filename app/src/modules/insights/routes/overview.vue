<template>
	<private-view :title="t('insights')">
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded disabled icon secondary>
				<v-icon name="insights" />
			</v-button>
		</template>

		<template #navigation>
			<insights-navigation @create="createDialogActive = true" />
		</template>

		<template #actions>
			<dashboard-dialog v-model="createDialogActive">
				<template #activator="{ on }">
					<v-button
						v-tooltip.bottom="createAllowed ? t('create_dashboard') : t('not_allowed')"
						rounded
						icon
						:disabled="createAllowed === false"
						@click="on"
					>
						<v-icon name="add" />
					</v-button>
				</template>
			</dashboard-dialog>
		</template>

		<template #sidebar>
			<sidebar-detail icon="info_outline" :title="t('information')" close>
				<div v-md="t('page_help_insights_overview')" class="page-description" />
			</sidebar-detail>
		</template>

		<v-table
			v-if="dashboards.length > 0"
			v-model:headers="tableHeaders"
			:items="dashboards"
			show-resize
			fixed-header
			@click:row="navigateToDashboard"
		>
			<template #[`item.icon`]="{ item }">
				<v-icon class="icon" :name="item.icon" />
			</template>

			<template #item-append="{ item }">
				<v-menu placement="left-start" show-arrow>
					<template #activator="{ toggle }">
						<v-icon name="more_vert" class="ctx-toggle" @click="toggle" />
					</template>

					<v-list>
						<v-list-item class="warning" clickable @click="editDashboard = item">
							<v-list-item-icon>
								<v-icon name="edit" outline />
							</v-list-item-icon>
							<v-list-item-content>
								{{ t('edit_dashboard') }}
							</v-list-item-content>
						</v-list-item>

						<v-list-item class="danger" clickable @click="confirmDelete = item.id">
							<v-list-item-icon>
								<v-icon name="delete" outline />
							</v-list-item-icon>
							<v-list-item-content>
								{{ t('delete_dashboard') }}
							</v-list-item-content>
						</v-list-item>
					</v-list>
				</v-menu>
			</template>
		</v-table>

		<v-info v-else icon="dashboard" :title="t('no_dashboards')" center>
			{{ t('no_dashboards_copy') }}
		</v-info>

		<v-dialog :model-value="!!confirmDelete" @esc="confirmDelete = null">
			<v-card>
				<v-card-title>{{ t('dashboard_delete_confirm') }}</v-card-title>

				<v-card-actions>
					<v-button secondary @click="confirmDelete = null">
						{{ t('cancel') }}
					</v-button>
					<v-button danger :loading="deletingDashboard" @click="deleteDashboard">
						{{ t('delete_label') }}
					</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<dashboard-dialog
			:model-value="!!editDashboard"
			:dashboard="editDashboard"
			@update:model-value="editDashboard = null"
		/>
	</private-view>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from 'vue';
import { useInsightsStore, usePermissionsStore } from '@/stores';
import { useI18n } from 'vue-i18n';
import { Dashboard } from '@/types';
import { router } from '@/router';
import InsightsNavigation from '../components/navigation.vue';
import DashboardDialog from '../components/dashboard-dialog.vue';
import api from '@/api';
import { unexpectedError } from '@/utils/unexpected-error';
import { md } from '@/utils/md';

export default defineComponent({
	name: 'InsightsOverview',
	components: { InsightsNavigation, DashboardDialog },
	setup() {
		const { t } = useI18n();

		const insightsStore = useInsightsStore();
		const permissionsStore = usePermissionsStore();

		const confirmDelete = ref<string | null>(null);
		const deletingDashboard = ref(false);
		const editDashboard = ref<Dashboard | null>(null);

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
				text: t('name'),
				value: 'name',
				width: 240,
			},
			{
				text: t('note'),
				value: 'note',
				width: 360,
			},
		];

		const dashboards = computed(() => insightsStore.dashboards);

		return {
			dashboards,
			createAllowed,
			tableHeaders,
			navigateToDashboard,
			createDialogActive,
			confirmDelete,
			deletingDashboard,
			deleteDashboard,
			editDashboard,
			t,
			md,
		};

		function navigateToDashboard(dashboard: Dashboard) {
			router.push(`/insights/${dashboard.id}`);
		}

		async function deleteDashboard() {
			if (!confirmDelete.value) return;

			deletingDashboard.value = true;

			try {
				await api.delete(`/dashboards/${confirmDelete.value}`);
				await insightsStore.hydrate();
				confirmDelete.value = null;
			} catch (err) {
				unexpectedError(err);
			} finally {
				deletingDashboard.value = false;
			}
		}
	},
});
</script>

<style scoped>
.v-table {
	padding: var(--content-padding);
	padding-top: 0;
}

.ctx-toggle {
	--v-icon-color: var(--foreground-subdued);
	--v-icon-color-hover: var(--foreground-normal);
}

.v-list-item.danger {
	--v-list-item-color: var(--danger);
	--v-list-item-color-hover: var(--danger);
	--v-list-item-icon-color: var(--danger);
}

.v-list-item.warning {
	--v-list-item-color: var(--warning);
	--v-list-item-color-hover: var(--warning);
	--v-list-item-icon-color: var(--warning);
}

.header-icon {
	--v-button-color-disabled: var(--foreground-normal);
}
</style>
