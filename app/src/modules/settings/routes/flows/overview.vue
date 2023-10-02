<template>
	<private-view :title="t('flows')">
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded disabled icon>
				<v-icon name="bolt" />
			</v-button>
		</template>

		<template #headline>
			<v-breadcrumb :items="[{ name: t('settings'), to: '/settings' }]" />
		</template>

		<template #navigation>
			<settings-navigation />
		</template>

		<template #actions>

			<v-input
				v-model="search"
				class="search"
				:autofocus="flowsStore.flows.length > 25"
				type="search"
				:placeholder="t('search_flow')"
				:full-width="false"
			>
				<template #prepend>
					<v-icon name="search" outline />
				</template>
				<template #append>
					<v-icon v-if="search" clickable class="clear" name="close" @click.stop="search = null" />
				</template>
			</v-input>

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
			<v-button
				v-tooltip.bottom="createAllowed ? t('create_flow') : t('not_allowed')"
				rounded
				icon
				:disabled="createAllowed === false"
				@click="editFlow = '+'"
			>
				<v-icon name="add" />
			</v-button>
		</template>

		<template #sidebar>
			<sidebar-detail icon="info" :title="t('information')" close>
				<div v-md="t('page_help_settings_flows_collection')" class="page-description" />
			</sidebar-detail>
		</template>

		<v-info v-if="flows.length === 0" icon="bolt" :title="t('no_flows')" center>
			{{ search ? t('no_flows_copy_search') : t('no_flows_copy') }}

			<template v-if="createAllowed && !search" #append>
				<v-button @click="editFlow = '+'">{{ t('create_flow') }}</v-button>
			</template>
		</v-info>

		<v-table
			v-else
			v-model:headers="tableHeaders"
			v-model="selection"
			:items="flows"
			:sort="internalSort"
			show-resize
			fixed-header
			selection-use-keys
			item-key="id"
			show-select="multiple"
			@click:row="navigateToFlow"
			@update:sort="updateSort($event)"
		>
			<template #[`item.icon`]="{ item }">
				<v-icon class="icon" :name="item.icon ?? 'bolt'" :color="item.color ?? 'var(--primary)'" />
			</template>

			<template #[`item.status`]="{ item }">
				<display-formatted-value
					type="string"
					:item="item"
					:value="item.status"
					:conditional-formatting="conditionalFormatting"
				/>
			</template>

			<template #item-append="{ item }">
				<v-menu placement="left-start" show-arrow>
					<template #activator="{ toggle }">
						<v-icon name="more_vert" class="ctx-toggle" @click="toggle" />
					</template>

					<v-list>
						<v-list-item clickable @click="toggleFlowStatusById(item.id, item.status)">
							<template v-if="item.status === 'active'">
								<v-list-item-icon><v-icon name="block" /></v-list-item-icon>
								<v-list-item-content>{{ t('set_flow_inactive') }}</v-list-item-content>
							</template>
							<template v-else>
								<v-list-item-icon><v-icon name="check" /></v-list-item-icon>
								<v-list-item-content>{{ t('set_flow_active') }}</v-list-item-content>
							</template>
						</v-list-item>

						<v-list-item clickable @click="editFlow = item.id">
							<v-list-item-icon>
								<v-icon name="edit" outline />
							</v-list-item-icon>
							<v-list-item-content>
								{{ t('edit_flow') }}
							</v-list-item-content>
						</v-list-item>

						<v-list-item class="danger" clickable @click="confirmDelete = item">
							<v-list-item-icon>
								<v-icon name="delete" outline />
							</v-list-item-icon>
							<v-list-item-content>
								{{ t('delete_flow') }}
							</v-list-item-content>
						</v-list-item>
					</v-list>
				</v-menu>
			</template>
		</v-table>

		<v-dialog :model-value="!!confirmDelete" @esc="confirmDelete = null">
			<v-card>
				<v-card-title>{{ t('flow_delete_confirm', { flow: confirmDelete!.name }) }}</v-card-title>

				<v-card-actions>
					<v-button secondary @click="confirmDelete = null">
						{{ t('cancel') }}
					</v-button>
					<v-button danger :loading="deletingFlow" @click="deleteFlow">
						{{ t('delete_label') }}
					</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<flow-drawer
			:active="editFlow !== undefined"
			:primary-key="editFlow"
			@cancel="editFlow = undefined"
			@done="onFlowDrawerCompletion"
		/>

		<router-view name="add" />
	</private-view>
</template>

<script setup lang="ts">
import api from '@/api';
import { Sort, Header } from '@/components/v-table/types';
import { router } from '@/router';
import { useFlowsStore } from '@/stores/flows';
import { usePermissionsStore } from '@/stores/permissions';
import { unexpectedError } from '@/utils/unexpected-error';
import { FlowRaw } from '@directus/types';
import { sortBy } from 'lodash';
import { computed, ref, Ref } from 'vue';
import { useI18n } from 'vue-i18n';
import SettingsNavigation from '../../components/navigation.vue';
import FlowDrawer from './flow-drawer.vue';

const { t } = useI18n();

const permissionsStore = usePermissionsStore();

const confirmDelete = ref<FlowRaw | null>(null);
const deletingFlow = ref(false);
const editFlow = ref<string | undefined>();

const selection = ref<string[]>([]);
const search = ref<string | null>(null);

const createAllowed = computed<boolean>(() => {
	return permissionsStore.hasPermission('directus_flows', 'create');
});

const batchDeleteAllowed = computed<boolean>(() => {
	return permissionsStore.hasPermission('directus_flows', 'delete');
});

const conditionalFormatting = ref([
	{
		operator: 'eq',
		value: 'active',
		text: t('active'),
		color: 'var(--foreground-inverted)',
		background: 'var(--primary)',
	},
	{
		operator: 'eq',
		value: 'inactive',
		text: t('inactive'),
		color: 'var(--foreground-subdued)',
		background: 'var(--background-normal)',
	},
]);

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
		text: t('status'),
		value: 'status',
		width: 100,
		sortable: true,
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
		text: t('description'),
		value: 'description',
		width: 360,
		sortable: false,
		align: 'left',
		description: null,
	},
]);

const internalSort: Ref<Sort> = ref({ by: 'name', desc: false });

const flowsStore = useFlowsStore();

const flows = computed(() => {
	const storedFlows = flowsStore.flows;

	const searchedFlows = search.value
		? storedFlows.filter((flow) => flow.name.toLowerCase().includes(search.value!.toLowerCase()))
		: storedFlows;

	const sortedFlows = sortBy(searchedFlows, [internalSort.value.by]);
	return internalSort.value.desc ? sortedFlows.reverse() : sortedFlows;
});

function updateSort(sort: Sort | null) {
	internalSort.value = sort ?? { by: 'name', desc: false };
}

function navigateToFlow({ item: flow }: { item: FlowRaw }) {
	router.push(`/settings/flows/${flow.id}`);
}

async function deleteFlow() {
	if (!confirmDelete.value) return;

	deletingFlow.value = true;

	try {
		await api.delete(`/flows/${confirmDelete.value.id}`);
		await flowsStore.hydrate();
		confirmDelete.value = null;
	} catch (err: any) {
		unexpectedError(err);
	} finally {
		deletingFlow.value = false;
	}
}

const confirmBatchDelete = ref(false);
const batchDeleting = ref(false);

async function batchDelete() {
	batchDeleting.value = true;

	const batchPrimaryKeys = selection.value;

	try {
		await api.delete(`/flows`, {
			data: batchPrimaryKeys,
		});

		selection.value = [];
		await flowsStore.hydrate();
	} catch (err: any) {
		unexpectedError(err);
	} finally {
		confirmBatchDelete.value = false;
		batchDeleting.value = false;
	}
}

async function toggleFlowStatusById(id: string, value: string) {
	try {
		await api.patch(`/flows/${id}`, {
			status: value === 'active' ? 'inactive' : 'active',
		});

		await flowsStore.hydrate();
	} catch (error) {
		unexpectedError(error as Error);
	}
}

function onFlowDrawerCompletion(id: string) {
	if (editFlow.value === '+') {
		router.push(`/settings/flows/${id}`);
	}

	editFlow.value = undefined;
}
</script>

<style scoped>

.v-input.search {
	height: var(--v-button-height);
	--border-radius: calc(44px / 2);
	width: 200px;
	margin-left: auto;

	@media (min-width: 600px) {
		width: 300px;
		margin-top: 0px;
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
	--v-icon-color: var(--foreground-subdued);
	--v-icon-color-hover: var(--foreground-normal);
}

.v-list-item.danger {
	--v-list-item-color: var(--danger);
	--v-list-item-color-hover: var(--danger);
	--v-list-item-icon-color: var(--danger);
}

.header-icon {
	--v-button-color-disabled: var(--primary);
	--v-button-background-color-disabled: var(--primary-10);
}
</style>
