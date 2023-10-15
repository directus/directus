<script setup lang="ts">
import { computed, ref, Ref } from 'vue';
import { useInsightsStore } from '@/stores/insights';
import { usePermissionsStore } from '@/stores/permissions';
import { useI18n } from 'vue-i18n';
import { Dashboard } from '@/types/insights';
import { router } from '@/router';
import { Sort, Header } from '@/components/v-table/types';
import { sortBy } from 'lodash';
import InsightsNavigation from '../components/navigation.vue';
import DashboardDialog from '../components/dashboard-dialog.vue';
import BasicImportSidebarDetail from '@/views/private/components/basic-import-sidebar-detail.vue';
import api from '@/api';
import { unexpectedError } from '@/utils/unexpected-error';
import { getEndpoint } from '@directus/utils';
import { getPublicURL } from '@/utils/get-root-path';

const { t } = useI18n();

const insightsStore = useInsightsStore();
const permissionsStore = usePermissionsStore();

const confirmDelete = ref<string | null>(null);
const deletingDashboard = ref(false);
const editDashboard = ref<Dashboard | null>(null);

const selection = ref<string[]>([]);
const search = ref<string | null>(null);

const createDialogActive = ref(false);

const createAllowed = computed<boolean>(() => {
	return permissionsStore.hasPermission('directus_dashboards', 'create');
});

const updateAllowed = computed<boolean>(() => {
	return permissionsStore.hasPermission('directus_dashboards', 'update');
});

const deleteAllowed = computed<boolean>(() => {
	return permissionsStore.hasPermission('directus_dashboards', 'delete');
});

const batchDeleteAllowed = computed<boolean>(() => {
	return permissionsStore.hasPermission('directus_dashboards', 'delete');
});

const internalSort: Ref<Sort> = ref({ by: 'name', desc: false });

function refresh() {
	insightsStore.hydrate();
}

function updateSort(sort: Sort | null) {
	internalSort.value = sort ?? { by: 'name', desc: false };
}

const tableHeaders = ref<Header[]>([
	{
		text: '',
		value: 'icon',
		width: 42,
		sortable: false,
		align: 'left',
		description: null,
	},
	{
		text: t('name'),
		value: 'name',
		width: 240,
		sortable: true,
		align: 'left',
		description: null,
	},
	{
		text: t('note'),
		value: 'note',
		width: 360,
		sortable: false,
		align: 'left',
		description: null,
	},
]);

const dashboards = computed(() => {
	const insightDasboards = insightsStore.dashboards;

	const searchedDashboards = search.value
		? insightDasboards.filter((dashboard) => dashboard.name.toLowerCase().includes(search.value!.toLowerCase()))
		: insightDasboards;

	const sortedDashboards = sortBy(searchedDashboards, [internalSort.value.by]);
	return internalSort.value.desc ? sortedDashboards.reverse() : sortedDashboards;
});

function navigateToDashboard({ item: dashboard }: { item: Dashboard }) {
	router.push(`/insights/${dashboard.id}`);
}

function getNewDashboardData(id: string) {
	return {
		...insightsStore.getDashboard(id),
		panels: insightsStore.getPanelsForDashboard(id).map((panel) => {
			return {
				...panel,
				date_created: undefined,
				user_created: undefined,
				id: undefined,
			};
		}),
		date_created: undefined,
		user_created: undefined,
		id: undefined,
	};
}

const duplicating = ref<string | null>(null);

async function duplicateDashboard(id: string, toggle: () => void) {
	duplicating.value = id;
	const values = getNewDashboardData(id);
	await api.post('/dashboards', { ...values, name: `${values.name} (copy)` }, { params: { fields: ['id'] } });
	await insightsStore.hydrate();
	duplicating.value = null;
	toggle();
}

function exportDasboard(ids: string[]) {
	const endpoint = getEndpoint('directus_dashboards');

	// usually getEndpoint contains leading slash, but here we need to remove it
	const url = getPublicURL() + endpoint.substring(1);

	const params: Record<string, unknown> = {
		access_token: (api.defaults.headers.common['Authorization'] as string).substring(7),
		export: 'json',
		fields: [
			'name',
			'icon',
			'note',
			'color',
			'panels.name',
			'panels.icon',
			'panels.color',
			'panels.show_header',
			'panels.note',
			'panels.type',
			'panels.position_x',
			'panels.position_y',
			'panels.width',
			'panels.height',
			'panels.options',
		],
		filter: {
			id: {
				_in: ids,
			},
		},
	};

	const exportUrl = api.getUri({
		url,
		params,
	});

	window.open(exportUrl);
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

const confirmBatchDelete = ref(false);
const batchDeleting = ref(false);

async function batchDelete() {
	batchDeleting.value = true;

	const batchPrimaryKeys = selection.value;

	try {
		await api.delete(`/dashboards`, {
			data: batchPrimaryKeys,
		});

		selection.value = [];
		await refresh();
	} catch (err: any) {
		unexpectedError(err);
	} finally {
		confirmBatchDelete.value = false;
		batchDeleting.value = false;
	}
}
</script>

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
			<v-input
				v-model="search"
				class="search"
				:autofocus="insightsStore.dashboards.length > 25"
				type="search"
				:placeholder="t('search_dashboard')"
				:full-width="false"
			>
				<template #prepend>
					<v-icon name="search" outline />
				</template>
				<template #append>
					<v-icon v-if="search" clickable class="clear" name="close" @click.stop="search = null" />
				</template>
			</v-input>

			<v-button
				v-if="selection.length > 0"
				v-tooltip.bottom="createAllowed ? t('export_dashboard') : t('not_allowed')"
				:disabled="createAllowed !== true"
				rounded
				icon
				secondary
				@click="exportDasboard(selection)"
			>
				<v-icon name="download" outline />
			</v-button>

			<v-dialog v-if="selection.length > 0" v-model="confirmBatchDelete" @esc="confirmBatchDelete = false">
				<template #activator="{ on }">
					<v-button
						v-tooltip.bottom="batchDeleteAllowed ? t('delete_label') : t('not_allowed')"
						:disabled="batchDeleteAllowed !== true"
						rounded
						icon
						class="action-delete"
						secondary
						@click="on"
					>
						<v-icon name="delete" outline />
					</v-button>
				</template>

				<v-card>
					<v-card-title>{{ t('batch_delete_confirm', selection.length) }}</v-card-title>

					<v-card-actions>
						<v-button secondary @click="confirmBatchDelete = false">
							{{ t('cancel') }}
						</v-button>
						<v-button kind="danger" :loading="batchDeleting" @click="batchDelete">
							{{ t('delete_label') }}
						</v-button>
					</v-card-actions>
				</v-card>
			</v-dialog>

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
			<sidebar-detail icon="info" :title="t('information')" close>
				<div v-md="t('page_help_insights_overview')" class="page-description" />
			</sidebar-detail>
			<basic-import-sidebar-detail collection="directus_dashboards" @refresh="refresh" />
		</template>

		<v-table
			v-if="dashboards.length > 0"
			v-model:headers="tableHeaders"
			v-model="selection"
			:items="dashboards"
			show-resize
			fixed-header
			:sort="internalSort"
			selection-use-keys
			item-key="id"
			show-select="multiple"
			@click:row="navigateToDashboard"
			@update:sort="updateSort($event)"
		>
			<template #[`item.icon`]="{ item }">
				<v-icon class="icon" :name="item.icon" :color="item.color" />
			</template>

			<template #item-append="{ item }">
				<v-menu placement="left-start" show-arrow :close-on-content-click="false">
					<template #activator="{ toggle }">
						<v-icon name="more_vert" class="ctx-toggle" @click="toggle" />
					</template>
					<template #default="{ toggle }">
						<v-list>
							<v-list-item
								class="warning"
								:disabled="!updateAllowed"
								clickable
								@click="
									editDashboard = item;
									toggle();
								"
							>
								<v-list-item-icon>
									<v-icon name="edit" />
								</v-list-item-icon>
								<v-list-item-content>
									{{ t('edit_dashboard') }}
								</v-list-item-content>
							</v-list-item>

							<v-list-item class="warning" clickable @click="duplicateDashboard(item.id, toggle)">
								<v-list-item-icon>
									<v-progress-circular v-if="duplicating === item.id" indeterminate small />
									<v-icon v-if="duplicating !== item.id" name="content_copy" />
								</v-list-item-icon>
								<v-list-item-content>
									{{ t('duplicate_dashboard') }}
								</v-list-item-content>
							</v-list-item>

							<v-list-item class="warning" clickable @click="exportDasboard([item.id])">
								<v-list-item-icon>
									<v-icon name="download" />
								</v-list-item-icon>
								<v-list-item-content>
									{{ t('export_dashboard') }}
								</v-list-item-content>
							</v-list-item>

							<v-list-item
								class="danger"
								:disabled="!deleteAllowed"
								clickable
								@click="
									confirmDelete = item.id;
									toggle();
								"
							>
								<v-list-item-icon>
									<v-icon name="delete" />
								</v-list-item-icon>
								<v-list-item-content>
									{{ t('delete_dashboard') }}
								</v-list-item-content>
							</v-list-item>
						</v-list>
					</template>
				</v-menu>
			</template>
		</v-table>

		<v-info v-else icon="dashboard" :title="t('no_dashboards')" center>
			{{ search ? t('no_dashboards_copy_search') : t('no_dashboards_copy') }}

			<template v-if="createAllowed && !search" #append>
				<dashboard-dialog v-model="createDialogActive">
					<template #activator="{ on }">
						<v-button v-tooltip.bottom="createAllowed ? t('create_dashboard') : t('not_allowed')" @click="on">
							{{ t('create_dashboard') }}
						</v-button>
					</template>
				</dashboard-dialog>
			</template>
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

<style scoped lang="scss">
.v-input {
	&.search {
		height: var(--v-button-height);
		--border-radius: calc(44px / 2);
		width: 200px;
		margin-left: auto;

		@media (min-width: 600px) {
			width: 300px;
			margin-top: 0px;
		}
	}
}
.action-delete {
	--v-button-background-color-hover: var(--danger) !important;
	--v-button-color-hover: var(--white) !important;
}

.v-table {
	padding: var(--content-padding);
	padding-top: 0;
}

.ctx-toggle {
	--v-icon-color: var(--theme--foreground-subdued);
	--v-icon-color-hover: var(--theme--foreground);
}

.v-list-item.danger {
	--v-list-item-color: var(--theme--danger);
	--v-list-item-color-hover: var(--theme--danger);
	--v-list-item-icon-color: var(--theme--danger);
}

.header-icon {
	--v-button-color-disabled: var(--theme--foreground);
}
</style>
