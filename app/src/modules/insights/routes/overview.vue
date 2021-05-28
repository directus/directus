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
			<dashboard-dialog v-model="createDialogActive">
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
			</dashboard-dialog>
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

			<template #item-append="{ item }">
				<v-menu placement="left-start" show-arrow>
					<template #activator="{ toggle }">
						<v-icon name="more_vert" @click="toggle" class="ctx-toggle" />
					</template>

					<v-list>
						<v-list-item @click="editDashboard = item" class="warning">
							<v-list-item-icon>
								<v-icon name="edit" outline />
							</v-list-item-icon>
							<v-list-item-content>
								{{ $t('edit_dashboard') }}
							</v-list-item-content>
						</v-list-item>

						<v-list-item @click="confirmDelete = item.id" class="danger">
							<v-list-item-icon>
								<v-icon name="delete" outline />
							</v-list-item-icon>
							<v-list-item-content>
								{{ $t('delete_dashboard') }}
							</v-list-item-content>
						</v-list-item>
					</v-list>
				</v-menu>
			</template>
		</v-table>

		<v-info icon="dashboard" :title="$t('no_dashboards')" v-else center>
			{{ $t('no_dashboards_copy') }}
		</v-info>

		<v-dialog :active="!!confirmDelete" @esc="confirmDelete = null">
			<v-card>
				<v-card-title>{{ $t('dashboard_delete_confirm') }}</v-card-title>

				<v-card-actions>
					<v-button @click="confirmDelete = null" secondary>
						{{ $t('cancel') }}
					</v-button>
					<v-button class="action-delete" @click="deleteDashboard" :loading="deletingDashboard">
						{{ $t('delete') }}
					</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<dashboard-dialog v-if="editDashboard" active @toggle="editDashboard = null" :dashboard="editDashboard" />
	</private-view>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from '@vue/composition-api';
import { useInsightsStore, usePermissionsStore } from '@/stores';
import i18n from '@/lang';
import { Dashboard } from '@/types';
import router from '@/router';
import InsightsNavigation from '../components/navigation.vue';
import DashboardDialog from '../components/dashboard-dialog.vue';
import api from '@/api';
import { unexpectedError } from '@/utils/unexpected-error';

export default defineComponent({
	name: 'InsightsOverview',
	components: { InsightsNavigation, DashboardDialog },
	setup() {
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

		const dashboards = computed(() => insightsStore.state.dashboards);

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

.action-delete {
	--v-button-background-color: var(--danger-10);
	--v-button-color: var(--danger);
	--v-button-background-color-hover: var(--danger-25);
	--v-button-color-hover: var(--danger);
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
</style>
