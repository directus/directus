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
			{{ t('no_flows_copy') }}

			<template v-if="createAllowed" #append>
				<v-button @click="editFlow = '+'">{{ t('create_flow') }}</v-button>
			</template>
		</v-info>

		<v-table
			v-else
			v-model:headers="tableHeaders"
			:items="flows"
			:sort="internalSort"
			show-resize
			fixed-header
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

const createAllowed = computed<boolean>(() => {
	return permissionsStore.hasPermission('directus_flows', 'create');
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
	const sortedFlows = sortBy(flowsStore.flows, [internalSort.value.by]);
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
