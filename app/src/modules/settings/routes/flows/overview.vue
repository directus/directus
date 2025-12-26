<script setup lang="ts">
import api from '@/api';
import TransitionExpand from '@/components/transition/expand.vue';
import VBreadcrumb from '@/components/v-breadcrumb.vue';
import VButton from '@/components/v-button.vue';
import VInfo from '@/components/v-info.vue';
import VList from '@/components/v-list.vue';
import { useExpandCollapse } from '@/composables/use-expand-collapse';
import { useVisibilityTree } from '@/composables/use-visibility-tree';
import { useCollectionPermissions } from '@/composables/use-permissions';
import { router } from '@/router';
import { useFlowsStore } from '@/stores/flows';
import { unexpectedError } from '@/utils/unexpected-error';
import SearchInput from '@/views/private/components/search-input.vue';
import { PrivateViewHeaderBarActionButton } from '@/views/private';
import { PrivateView } from '@/views/private';
import type { FlowRaw } from '@directus/types';
import { computed, ref } from 'vue';
import { RouterView } from 'vue-router';
import Draggable from 'vuedraggable';
import SettingsNavigation from '../../components/navigation.vue';
import FlowDrawer from './flow-drawer.vue';
import FlowFolderDialog from './components/flow-folder-dialog.vue';
import FlowItem from './components/flow-item.vue';

const { createAllowed } = useCollectionPermissions('directus_flows');

const search = ref<string | null>(null);
const folderDialogActive = ref(false);
const editFolderFlow = ref<FlowRaw | null>(null);
const editFlow = ref<string | undefined>();

const flowsStore = useFlowsStore();

// Expand/collapse management
const { collapsedIds, hasExpandable, expandAll, collapseAll, toggleCollapse } = useExpandCollapse(
	'collapsed-flow-ids',
	{
		getExpandableIds: () =>
			flowsStore.flows
				.filter((flow) => flowsStore.flows.some((f) => f.group === flow.id))
				.map((flow) => flow.id),
		getAllIds: () => flowsStore.flows.map((flow) => flow.id),
	},
);

// Flows with collapse state
const flows = computed(() =>
	flowsStore.sortedFlows.map((flow) => ({
		...flow,
		isCollapsed: collapsedIds.value?.includes(flow.id) ?? false,
	})),
);

// Root flows (no parent)
const rootFlows = computed(() => flows.value.filter((flow) => !flow.group));

// Visibility tree for search
const { findVisibilityNode } = useVisibilityTree(
	computed(() => flowsStore.flows),
	search,
	{
		getId: (flow) => flow.id,
		getParent: (flow) => flow.group ?? null,
		matchesSearch: (flow, searchQuery) => {
			// Match on name, status (exact), description, and trigger
			return (
				flow.name?.toLowerCase().includes(searchQuery) ||
				flow.status?.toLowerCase() === searchQuery ||
				flow.description?.toLowerCase().includes(searchQuery) ||
				flow.trigger?.toLowerCase().includes(searchQuery) ||
				false
			);
		},
	},
);

async function onSort(updates: { id: string; group: string | null }[], removeGroup = false) {
	const updatesWithSort = updates.map((update, index) => ({
		id: update.id,
		sort: index + 1,
		group: removeGroup ? null : update.group,
	}));

	// Optimistic update
	flowsStore.flows = flowsStore.flows.map((flow) => {
		const update = updatesWithSort.find((u) => u.id === flow.id);
		return update ? { ...flow, ...update } : flow;
	});

	try {
		await api.patch('/flows', updatesWithSort);
	} catch (error) {
		unexpectedError(error);
		await flowsStore.hydrate();
	}
}

function onRootSortChange(sortedFlows: FlowRaw[]) {
	onSort(
		sortedFlows.map((flow) => ({ id: flow.id, group: null })),
		true,
	);
}

function onNestedSortChange(updates: { id: string; group: string }[]) {
	onSort(updates);
}

function handleEditFlow(flow: FlowRaw) {
	if (flow.trigger === null) {
		// It's a folder, open folder dialog
		editFolderFlow.value = flow;
		folderDialogActive.value = true;
	} else {
		// It's a flow, open flow drawer
		editFlow.value = flow.id;
	}
}

function onFlowDrawerCompletion(id: string) {
	if (editFlow.value === '+') {
		router.push(`/settings/flows/${id}`);
	}

	editFlow.value = undefined;
}

function openFolderDialog() {
	editFolderFlow.value = null;
	folderDialogActive.value = true;
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
			<SearchInput v-model="search" :show-filter="false" />

			<PrivateViewHeaderBarActionButton
				v-tooltip.bottom="createAllowed ? $t('create_folder') : $t('not_allowed')"
				:disabled="createAllowed === false"
				icon="create_new_folder"
				@click="openFolderDialog"
			/>

			<PrivateViewHeaderBarActionButton
				v-tooltip.bottom="createAllowed ? $t('create_flow') : $t('not_allowed')"
				:disabled="createAllowed === false"
				icon="add"
				@click="editFlow = '+'"
			/>
		</template>

		<div class="flows-content">
			<VInfo v-if="flows.length === 0" icon="bolt" :title="$t('no_flows')" center>
				{{ $t('no_flows_copy') }}

				<template v-if="createAllowed" #append>
					<VButton @click="editFlow = '+'">{{ $t('create_flow') }}</VButton>
				</template>
			</VInfo>

			<template v-else>
				<!-- Expand/Collapse controls -->
				<TransitionExpand>
					<div v-if="hasExpandable" class="expand-collapse-controls">
						<span>{{ $t('expand') }}</span>
						<button @click="expandAll">{{ $t('all') }}</button>
						<span>/</span>
						<button @click="collapseAll">{{ $t('none') }}</button>
					</div>
				</TransitionExpand>

				<!-- Flows list -->
				<VList class="flows-list draggable-list">
					<Draggable
						:model-value="rootFlows"
						:group="{ name: 'flows' }"
						:swap-threshold="0.3"
						class="root-drag-container"
						item-key="id"
						handle=".drag-handle"
						v-bind="{ 'force-fallback': true }"
						@update:model-value="onRootSortChange"
					>
						<template #item="{ element }">
							<FlowItem
								:flow="element"
								:flows="flows"
								:is-collapsed="element.isCollapsed"
								:visibility-tree="findVisibilityNode(element.id) ?? { id: element.id, visible: true, children: [], search: null, findChild: () => undefined }"
								@edit-flow="handleEditFlow"
								@set-nested-sort="onNestedSortChange"
								@toggle-collapse="toggleCollapse"
							/>
						</template>
					</Draggable>
				</VList>
			</template>
		</div>

		<!-- Folder dialog -->
		<FlowFolderDialog
			v-model="folderDialogActive"
			:flow="editFolderFlow"
		/>

		<!-- Flow drawer -->
		<FlowDrawer
			:active="editFlow !== undefined"
			:primary-key="editFlow"
			@cancel="editFlow = undefined"
			@done="onFlowDrawerCompletion"
		/>

		<RouterView name="add" />
	</PrivateView>
</template>

<style scoped lang="scss">
.flows-content {
	padding: var(--content-padding);
}

.expand-collapse-controls {
	margin-block-end: 16px;
	font-size: 12px;
	color: var(--theme--foreground-subdued);

	button {
		padding: 0;
		margin: 0 4px;
		color: var(--theme--primary);
		text-decoration: underline;
		background: none;
		border: none;
		cursor: pointer;

		&:hover {
			color: var(--theme--primary-accent);
		}
	}
}

.flows-list {
	--v-list-padding: 0;
}

.root-drag-container {
	min-height: 100px;
}

.draggable-list :deep(.sortable-ghost) {
	.v-list-item {
		--v-list-item-background-color: var(--theme--primary-background);
		--v-list-item-border-color: var(--theme--primary);
		--v-list-item-background-color-hover: var(--theme--primary-background);
		--v-list-item-border-color-hover: var(--theme--primary);

		> * {
			opacity: 0;
		}
	}
}
</style>
