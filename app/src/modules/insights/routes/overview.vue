<script setup lang="ts">
import DashboardDialog from '../components/dashboard-dialog.vue';
import InsightsNavigation from '../components/navigation.vue';
import api from '@/api';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VInfo from '@/components/v-info.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VMenu from '@/components/v-menu.vue';
import VProgressCircular from '@/components/v-progress-circular.vue';
import { Header, Sort } from '@/components/v-table/types';
import VTable from '@/components/v-table/v-table.vue';
import { useCollectionPermissions } from '@/composables/use-permissions';
import { router } from '@/router';
import { useInsightsStore } from '@/stores/insights';
import { Dashboard } from '@/types/insights';
import { getPublicURL } from '@/utils/get-root-path';
import { unexpectedError } from '@/utils/unexpected-error';
import { PrivateViewHeaderBarActionButton } from '@/views/private';
import { PrivateView } from '@/views/private';
import BasicImportSidebarDetail from '@/views/private/components/basic-import-sidebar-detail.vue';
import SearchInput from '@/views/private/components/search-input.vue';
import { getEndpoint } from '@directus/utils';
import { sortBy } from 'lodash';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const insightsStore = useInsightsStore();

const confirmDelete = ref<string | null>(null);
const deletingDashboard = ref(false);
const editDashboard = ref<Dashboard>();

const selection = ref<string[]>([]);
const search = ref<string | null>(null);

const createDialogActive = ref(false);

const { createAllowed, updateAllowed, deleteAllowed } = useCollectionPermissions('directus_dashboards');
const batchDeleteAllowed = deleteAllowed;

const internalSort = ref<Sort>({ by: 'name', desc: false });

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

function exportDashboard(ids: string[]) {
	const endpoint = getEndpoint('directus_dashboards');

	// usually getEndpoint contains leading slash, but here we need to remove it
	const url = getPublicURL() + endpoint.substring(1);

	const params: Record<string, unknown> = {
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
	if (deletingDashboard.value || !confirmDelete.value) return;

	deletingDashboard.value = true;

	try {
		await api.delete(`/dashboards/${confirmDelete.value}`);
		await insightsStore.hydrate();
		confirmDelete.value = null;
	} catch (error) {
		unexpectedError(error);
	} finally {
		deletingDashboard.value = false;
	}
}

const confirmBatchDelete = ref(false);
const batchDeleting = ref(false);

async function batchDelete() {
	if (batchDeleting.value) return;

	batchDeleting.value = true;

	const batchPrimaryKeys = selection.value;

	try {
		await api.delete(`/dashboards`, {
			data: batchPrimaryKeys,
		});

		selection.value = [];
		refresh();
	} catch (error) {
		unexpectedError(error);
	} finally {
		confirmBatchDelete.value = false;
		batchDeleting.value = false;
	}
}
</script>

<template>
	<PrivateView :title="$t('insights')" icon="insights">
		<template #navigation>
			<InsightsNavigation @create="createDialogActive = true" />
		</template>

		<template #actions>
			<SearchInput
				v-if="insightsStore.dashboards.length > 0"
				v-model="search"
				:show-filter="false"
				:autofocus="insightsStore.dashboards.length > 25"
				:placeholder="$t('search_dashboard')"
				small
			/>

			<PrivateViewHeaderBarActionButton
				v-if="selection.length > 0"
				v-tooltip.bottom="createAllowed ? $t('export_dashboard') : $t('not_allowed')"
				:disabled="createAllowed !== true"
				secondary
				icon="download"
				@click="exportDashboard(selection)"
			/>

			<VDialog
				v-if="selection.length > 0"
				v-model="confirmBatchDelete"
				@esc="confirmBatchDelete = false"
				@apply="batchDelete"
			>
				<template #activator="{ on }">
					<PrivateViewHeaderBarActionButton
						v-tooltip.bottom="batchDeleteAllowed ? $t('delete_label') : $t('not_allowed')"
						:disabled="batchDeleteAllowed !== true"
						class="action-delete"
						secondary
						icon="delete"
						@click="on"
					/>
				</template>

				<VCard>
					<VCardTitle>{{ $t('batch_delete_confirm', selection.length) }}</VCardTitle>

					<VCardActions>
						<VButton secondary @click="confirmBatchDelete = false">
							{{ $t('cancel') }}
						</VButton>
						<VButton kind="danger" :loading="batchDeleting" @click="batchDelete">
							{{ $t('delete_label') }}
						</VButton>
					</VCardActions>
				</VCard>
			</VDialog>

			<DashboardDialog v-model="createDialogActive">
				<template #activator="{ on }">
					<PrivateViewHeaderBarActionButton
						v-tooltip.bottom="createAllowed ? $t('create_dashboard') : $t('not_allowed')"
						:disabled="createAllowed === false"
						icon="add"
						@click="on"
					/>
				</template>
			</DashboardDialog>
		</template>

		<template #sidebar>
			<BasicImportSidebarDetail collection="directus_dashboards" @refresh="refresh" />
		</template>

		<VTable
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
				<VIcon class="icon" :name="item.icon" :color="item.color" />
			</template>

			<template #item-append="{ item }">
				<VMenu placement="left-start" show-arrow :close-on-content-click="false">
					<template #activator="{ toggle }">
						<VIcon name="more_vert" class="ctx-toggle" clickable @click="toggle" />
					</template>
					<template #default="{ toggle }">
						<VList>
							<VListItem
								class="warning"
								:disabled="!updateAllowed"
								clickable
								@click="
									editDashboard = item;
									toggle();
								"
							>
								<VListItemIcon>
									<VIcon name="edit" />
								</VListItemIcon>
								<VListItemContent>
									{{ $t('edit_dashboard') }}
								</VListItemContent>
							</VListItem>

							<VListItem class="warning" clickable @click="duplicateDashboard(item.id, toggle)">
								<VListItemIcon>
									<VProgressCircular v-if="duplicating === item.id" indeterminate small />
									<VIcon v-if="duplicating !== item.id" name="content_copy" />
								</VListItemIcon>
								<VListItemContent>
									{{ $t('duplicate_dashboard') }}
								</VListItemContent>
							</VListItem>

							<VListItem class="warning" clickable @click="exportDashboard([item.id])">
								<VListItemIcon>
									<VIcon name="download" />
								</VListItemIcon>
								<VListItemContent>
									{{ $t('export_dashboard') }}
								</VListItemContent>
							</VListItem>

							<VListItem
								class="danger"
								:disabled="!deleteAllowed"
								clickable
								@click="
									confirmDelete = item.id;
									toggle();
								"
							>
								<VListItemIcon>
									<VIcon name="delete" />
								</VListItemIcon>
								<VListItemContent>
									{{ $t('delete_dashboard') }}
								</VListItemContent>
							</VListItem>
						</VList>
					</template>
				</VMenu>
			</template>
		</VTable>

		<VInfo v-else-if="search" icon="search" :title="$t('no_results')" center>
			{{ $t('no_results_copy') }}

			<template #append>
				<VButton @click="search = null">{{ $t('clear_filters') }}</VButton>
			</template>
		</VInfo>

		<VInfo v-else icon="space_dashboard" :title="$t('no_dashboards')" center>
			{{ $t('no_dashboards_copy') }}

			<template v-if="createAllowed" #append>
				<DashboardDialog v-model="createDialogActive">
					<template #activator="{ on }">
						<VButton v-tooltip.bottom="createAllowed ? $t('create_dashboard') : $t('not_allowed')" @click="on">
							{{ $t('create_dashboard') }}
						</VButton>
					</template>
				</DashboardDialog>
			</template>
		</VInfo>

		<VDialog :model-value="!!confirmDelete" @esc="confirmDelete = null" @apply="deleteDashboard">
			<VCard>
				<VCardTitle>{{ $t('dashboard_delete_confirm') }}</VCardTitle>

				<VCardActions>
					<VButton secondary @click="confirmDelete = null">
						{{ $t('cancel') }}
					</VButton>
					<VButton danger :loading="deletingDashboard" @click="deleteDashboard">
						{{ $t('delete_label') }}
					</VButton>
				</VCardActions>
			</VCard>
		</VDialog>

		<DashboardDialog
			:model-value="!!editDashboard"
			:dashboard="editDashboard"
			@update:model-value="editDashboard = undefined"
		/>
	</PrivateView>
</template>

<style scoped lang="scss">
.action-delete {
	--v-button-background-color-hover: var(--danger) !important;
	--v-button-color-hover: var(--white) !important;
}

.v-table {
	padding: var(--content-padding);
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
