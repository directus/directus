<script setup lang="ts">
import FlowDrawer from './flow-drawer.vue';
import SettingsNavigation from '../../components/navigation.vue';
import api from '@/api';
import VBreadcrumb from '@/components/v-breadcrumb.vue';
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
import { Header, Sort } from '@/components/v-table/types';
import VTable from '@/components/v-table/v-table.vue';
import { useCollectionPermissions } from '@/composables/use-permissions';
import DisplayFormattedValue from '@/displays/formatted-value/formatted-value.vue';
import { router } from '@/router';
import { useFlowsStore } from '@/stores/flows';
import { unexpectedError } from '@/utils/unexpected-error';
import { PrivateViewHeaderBarActionButton } from '@/views/private';
import { PrivateView } from '@/views/private';
import { FlowRaw } from '@directus/types';
import { sortBy } from 'lodash';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterView } from 'vue-router';

const { t } = useI18n();

const { createAllowed } = useCollectionPermissions('directus_flows');

const confirmDelete = ref<FlowRaw | null>(null);
const deletingFlow = ref(false);
const editFlow = ref<string | undefined>();

const conditionalFormatting = ref([
	{
		operator: 'eq',
		value: 'active',
		text: t('active'),
		color: 'var(--foreground-inverted)',
		background: 'var(--theme--primary)',
	},
	{
		operator: 'eq',
		value: 'inactive',
		text: t('inactive'),
		color: 'var(--theme--foreground-subdued)',
		background: 'var(--theme--background-normal)',
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

const internalSort = ref<Sort>({ by: 'name', desc: false });

const flowsStore = useFlowsStore();

const flows = computed(() => {
	const sortedFlows = sortBy(flowsStore.flows, [internalSort.value.by]);
	return internalSort.value.desc ? sortedFlows.reverse() : sortedFlows;
});

function updateSort(sort: Sort | null) {
	internalSort.value = sort ?? { by: 'name', desc: false };
}

function navigateToFlow({ item: flow, event }: { item: FlowRaw; event: MouseEvent }) {
	const route = `/settings/flows/${flow.id}`;

	if (event.ctrlKey || event.metaKey || event.button === 1) {
		window.open(router.resolve(route).href, '_blank');
	} else {
		router.push(route);
	}
}

async function deleteFlow() {
	if (!confirmDelete.value || deletingFlow.value) return;

	deletingFlow.value = true;

	try {
		await api.delete(`/flows/${confirmDelete.value.id}`);
		await flowsStore.hydrate();
		confirmDelete.value = null;
	} catch (error) {
		unexpectedError(error);
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
		unexpectedError(error);
	}
}

function onFlowDrawerCompletion(id: string) {
	if (editFlow.value === '+') {
		router.push(`/settings/flows/${id}`);
	}

	editFlow.value = undefined;
}
</script>

<template>
	<PrivateView :title="$t('flows')" icon="bolt">
		<template #headline>
			<VBreadcrumb :items="[{ name: $t('settings'), to: '/settings' }]" />
		</template>

		<template #navigation>
			<SettingsNavigation />
		</template>

		<template #actions>
			<PrivateViewHeaderBarActionButton
				v-tooltip.bottom="createAllowed ? $t('create_flow') : $t('not_allowed')"
				:disabled="createAllowed === false"
				icon="add"
				@click="editFlow = '+'"
			/>
		</template>

		<VInfo v-if="flows.length === 0" icon="bolt" :title="$t('no_flows')" center>
			{{ $t('no_flows_copy') }}

			<template v-if="createAllowed" #append>
				<VButton @click="editFlow = '+'">{{ $t('create_flow') }}</VButton>
			</template>
		</VInfo>

		<VTable
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
				<VIcon class="icon" :name="item.icon ?? 'bolt'" :color="item.color ?? 'var(--theme--primary)'" />
			</template>

			<template #[`item.status`]="{ item }">
				<DisplayFormattedValue
					type="string"
					:item="item"
					:value="item.status"
					:conditional-formatting="conditionalFormatting"
				/>
			</template>

			<template #item-append="{ item }">
				<VMenu placement="left-start" show-arrow>
					<template #activator="{ toggle }">
						<VIcon name="more_vert" class="ctx-toggle" clickable @click="toggle" />
					</template>

					<VList>
						<VListItem clickable @click="toggleFlowStatusById(item.id, item.status)">
							<template v-if="item.status === 'active'">
								<VListItemIcon><VIcon name="block" /></VListItemIcon>
								<VListItemContent>{{ $t('set_flow_inactive') }}</VListItemContent>
							</template>
							<template v-else>
								<VListItemIcon><VIcon name="check" /></VListItemIcon>
								<VListItemContent>{{ $t('set_flow_active') }}</VListItemContent>
							</template>
						</VListItem>

						<VListItem clickable @click="editFlow = item.id">
							<VListItemIcon>
								<VIcon name="edit" outline />
							</VListItemIcon>
							<VListItemContent>
								{{ $t('edit_flow') }}
							</VListItemContent>
						</VListItem>

						<VListItem class="danger" clickable @click="confirmDelete = item">
							<VListItemIcon>
								<VIcon name="delete" outline />
							</VListItemIcon>
							<VListItemContent>
								{{ $t('delete_flow') }}
							</VListItemContent>
						</VListItem>
					</VList>
				</VMenu>
			</template>
		</VTable>

		<VDialog :model-value="!!confirmDelete" @esc="confirmDelete = null" @apply="deleteFlow">
			<VCard>
				<VCardTitle>{{ $t('flow_delete_confirm', { flow: confirmDelete!.name }) }}</VCardTitle>

				<VCardActions>
					<VButton secondary @click="confirmDelete = null">
						{{ $t('cancel') }}
					</VButton>
					<VButton danger :loading="deletingFlow" @click="deleteFlow">
						{{ $t('delete_label') }}
					</VButton>
				</VCardActions>
			</VCard>
		</VDialog>

		<FlowDrawer
			:active="editFlow !== undefined"
			:primary-key="editFlow"
			@cancel="editFlow = undefined"
			@done="onFlowDrawerCompletion"
		/>

		<RouterView name="add" />
	</PrivateView>
</template>

<style scoped>
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
	--v-button-color-disabled: var(--theme--primary);
	--v-button-background-color-disabled: var(--theme--primary-background);
}
</style>
