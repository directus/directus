<script setup lang="ts">
import { FlowRaw } from '@directus/types';
import { sortBy } from 'lodash';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterView } from 'vue-router';
import SettingsNavigation from '../../components/navigation.vue';
import FlowDrawer from './flow-drawer.vue';
import FlowFolderSidebar from './flow-folder-sidebar.vue';
import { useDuplicate } from './use-duplicate';
import { useMoveToFolder } from './use-move-to-folder';
import api from '@/api';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VInfo from '@/components/v-info.vue';
import VInput from '@/components/v-input.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VMenu from '@/components/v-menu.vue';
import { Header, Sort } from '@/components/v-table/types';
import VTable from '@/components/v-table/v-table.vue';
import { useCollectionPermissions } from '@/composables/use-permissions';
import DisplayFormattedValue from '@/displays/formatted-value/formatted-value.vue';
import AddFolder from '@/modules/files/components/add-folder.vue';
import { router } from '@/router';
import { useFlowsStore } from '@/stores/flows';
import { useLicenseStore } from '@/stores/license';
import { extractErrorCode } from '@/utils/extract-error-code';
import { translate } from '@/utils/translate-literal';
import { unexpectedError } from '@/utils/unexpected-error';
import { PrivateViewHeaderBarActionButton } from '@/views/private';
import { PrivateView } from '@/views/private';
import FolderPicker from '@/views/private/components/folder-picker.vue';
import EntitlementLimitModal from '@/views/private/components/license/entitlement-limit-modal.vue';
import EntitlementRemaining from '@/views/private/components/license/entitlement-remaining.vue';
import MaxCapacityAlert from '@/views/private/components/license/max-capacity-alert.vue';

const { t } = useI18n();

const props = defineProps<{
	folder?: string;
}>();

const { createAllowed } = useCollectionPermissions('directus_flows');
const { createAllowed: operationsCreateAllowed } = useCollectionPermissions('directus_operations');
const licenseStore = useLicenseStore();

const duplicateAllowed = computed(() => createAllowed.value && operationsCreateAllowed.value);

const confirmDelete = ref<FlowRaw | null>(null);
const deletingFlow = ref(false);
const editFlow = ref<string | undefined>();
const flowsLimitModalOpen = ref(false);

function openCreateFlow() {
	if (!licenseStore.limits.flows.hasRemaining) {
		flowsLimitModalOpen.value = true;
		return;
	}

	editFlow.value = '+';
}

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

const hasAnyFlows = computed(() => flowsStore.flows.length > 0);

const flows = computed(() => {
	const source = props.folder ? flowsStore.flows.filter((flow) => flow.folder === props.folder) : flowsStore.flows;

	const translatedFlows = source.map((flow) => ({ ...flow, name: translate(flow.name) }));
	const sortedFlows = sortBy(translatedFlows, [internalSort.value.by]);
	return internalSort.value.desc ? sortedFlows.reverse() : sortedFlows;
});

function navigateToFolder(folderId: string | null) {
	if (folderId) {
		router.push({ name: 'settings-flows-folder', params: { folder: folderId } });
	} else {
		router.push({ name: 'settings-flows-collection' });
	}
}

function updateSort(sort: Sort | null) {
	internalSort.value = sort ?? { by: 'name', desc: false };
}

const duplicateDialogActive = ref(false);
const duplicateSource = ref<FlowRaw | null>(null);
const duplicateName = ref('');

const { duplicating, duplicate } = useDuplicate({
	source: duplicateSource,
	name: duplicateName,
	onSuccess: async () => {
		duplicateDialogActive.value = false;
		await flowsStore.hydrate();
		licenseStore.hydrate();
	},
});

// Copies are always created inactive, and inactive Flows don't count against the license limit
function openDuplicateFlow(item: FlowRaw) {
	duplicateSource.value = item;
	duplicateName.value = `${item.name} (copy)`;
	duplicateDialogActive.value = true;
}

const selectedKeys = ref<string[]>([]);

// The same component renders every folder, so drop the selection when the folder changes to avoid
// acting on flows that are no longer in view
watch(
	() => props.folder,
	() => (selectedKeys.value = []),
);

const moveDialogActive = ref(false);
const moveTarget = ref<string | null>(null);

const { moving, move } = useMoveToFolder({
	onSuccess: async () => {
		moveDialogActive.value = false;
		selectedKeys.value = [];
		moveTarget.value = null;
		await flowsStore.hydrate();
	},
});

function openMoveToFolder() {
	moveTarget.value = props.folder ?? null;
	moveDialogActive.value = true;
}

function applyMoveToFolder() {
	move(selectedKeys.value, moveTarget.value);
}

function navigateToFlow({ item: flow, event }: { item: FlowRaw; event: MouseEvent }) {
	const route = { name: 'settings-flows-item', params: { primaryKey: flow.id } };

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
		licenseStore.hydrate();
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
		licenseStore.hydrate();
	} catch (error) {
		// Activating a Flow beyond the license limit is a plan problem, not an unexpected one
		if (extractErrorCode(error) === 'LIMIT_EXCEEDED') {
			flowsLimitModalOpen.value = true;
		} else {
			unexpectedError(error);
		}
	}
}

function onFlowDrawerCompletion(id: string) {
	if (editFlow.value === '+') {
		router.push({ name: 'settings-flows-item', params: { primaryKey: id } });
	}

	editFlow.value = undefined;
}
</script>

<template>
	<PrivateView :title="$t('flows')" icon="bolt">
		<template #navigation>
			<SettingsNavigation />
		</template>

		<template #actions:prepend>
			<AddFolder type="flows" :parent="folder" :disabled="createAllowed === false" @created="navigateToFolder" />
			<PrivateViewHeaderBarActionButton
				v-if="selectedKeys.length > 0"
				v-tooltip.bottom="$t('move_to_folder')"
				icon="folder_move"
				variant="ghost"
				@click="openMoveToFolder"
			/>
			<EntitlementRemaining entitlement-key="flows" />
		</template>

		<template #actions:primary>
			<PrivateViewHeaderBarActionButton
				:tooltip="createAllowed ? undefined : $t('not_allowed')"
				:label="$t('create')"
				:disabled="createAllowed === false"
				icon="add"
				@click="openCreateFlow"
			/>
		</template>

		<FlowFolderSidebar
			:current-folder="folder"
			:actions-disabled="createAllowed === false"
			@navigate="navigateToFolder"
		>
			<VInfo v-if="!hasAnyFlows" icon="bolt" :title="$t('no_flows')" center>
				{{ $t('no_flows_copy') }}

				<template v-if="createAllowed" #append>
					<VButton @click="openCreateFlow">{{ $t('create_flow') }}</VButton>
				</template>
			</VInfo>

			<div v-else class="padding-box">
				<MaxCapacityAlert v-if="!licenseStore.limits.flows.hasRemaining" entitlement-key="flows" />

				<VTable
					v-model:headers="tableHeaders"
					v-model="selectedKeys"
					:items="flows"
					:sort="internalSort"
					show-select="multiple"
					selection-use-keys
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

								<VListItem :disabled="!duplicateAllowed" clickable @click="openDuplicateFlow(item)">
									<VListItemIcon>
										<VIcon name="content_copy" />
									</VListItemIcon>
									<VListItemContent>
										{{ $t('duplicate_flow') }}
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
			</div>
		</FlowFolderSidebar>

		<VDialog v-model="moveDialogActive" @esc="moveDialogActive = false" @apply="applyMoveToFolder">
			<VCard>
				<VCardTitle>{{ $t('move_to_folder') }}</VCardTitle>
				<VCardText>
					<FolderPicker v-model="moveTarget" type="flows" :root-label="$t('all_flows')" />
				</VCardText>
				<VCardActions>
					<VButton secondary @click="moveDialogActive = false">{{ $t('cancel') }}</VButton>
					<VButton :loading="moving" @click="applyMoveToFolder">{{ $t('save') }}</VButton>
				</VCardActions>
			</VCard>
		</VDialog>

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

		<VDialog v-model="duplicateDialogActive" @esc="duplicateDialogActive = false" @apply="duplicate">
			<VCard>
				<VCardTitle>{{ $t('duplicate_flow') }}</VCardTitle>
				<VCardText>
					<VInput v-model="duplicateName" autofocus />
				</VCardText>
				<VCardActions>
					<VButton secondary @click="duplicateDialogActive = false">{{ $t('cancel') }}</VButton>
					<VButton :disabled="!duplicateName.trim()" :loading="duplicating" @click="duplicate">
						{{ $t('duplicate') }}
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

		<EntitlementLimitModal v-model="flowsLimitModalOpen" entitlement-key="flows" is-admin />
	</PrivateView>
</template>

<style scoped>
.padding-box {
	padding: var(--content-padding);
	padding-block-start: var(--content-padding-top-table);
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
