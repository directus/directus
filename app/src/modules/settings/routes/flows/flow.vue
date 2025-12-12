<script setup lang="ts">
import api from '@/api';
import { AppTile } from '@/components/v-workspace-tile.vue';
import { useEditsGuard } from '@/composables/use-edits-guard';
import { useShortcut } from '@/composables/use-shortcut';
import { useExtensions } from '@/extensions';
import { router } from '@/router';
import { useFlowsStore } from '@/stores/flows';
import { unexpectedError } from '@/utils/unexpected-error';
import { Vector2 } from '@/utils/vector2';
import PrivateViewHeaderBarActionButton from '@/views/private/private-view/components/private-view-header-bar-action-button.vue';
import { FlowRaw, OperationRaw } from '@directus/types';
import { cloneDeep, isEmpty, merge, omit } from 'lodash';
import { customAlphabet, nanoid } from 'nanoid/non-secure';
import { computed, ref, unref } from 'vue';
import { useI18n } from 'vue-i18n';
import SettingsNavigation from '../../components/navigation.vue';
import SettingsNotFound from '../not-found.vue';
import Arrows from './components/arrows/arrows.vue';
import LogsSidebarDetail from './components/logs-sidebar-detail.vue';
import Operation, { ArrowInfo, Target } from './components/operation.vue';
import { ATTACHMENT_OFFSET, PANEL_HEIGHT, PANEL_WIDTH } from './constants';
import FlowDrawer from './flow-drawer.vue';

// Maps the x and y coordinates of attachments of panels to their id
export type Attachments = Record<number, Record<number, string>>;
export type ParentInfo = { id: string; type: Target; loner: boolean };

const { t } = useI18n();

const props = defineProps<{
	primaryKey: string;
	operationId?: string;
}>();

const saving = ref(false);

useShortcut('meta+s', () => {
	/*
	 * Prevent saving of the Flow via shortcut when the  "Create Operation",
	 * "Edit Operation" or "Edit Trigger" drawer is opened
	 */
	if (props.operationId || unref(triggerDetailOpen)) return;

	saveChanges();
});

// ------------- Manage Current Flow ------------- //

const flowsStore = useFlowsStore();
const stagedFlow = ref<Partial<FlowRaw>>({});

const flow = computed<FlowRaw | undefined>({
	get() {
		const existing = flowsStore.flows.find((flow) => flow.id === props.primaryKey);

		if (!existing) return undefined;

		return merge({}, existing, {
			status: stagedFlow.value?.status ?? existing.status,
			operation: stagedFlow.value?.operation ?? existing.operation,
			operations: stagedFlow.value?.operations ?? existing.operations,
		});
	},
	set(newFlow) {
		stagedFlow.value = newFlow ?? {};
	},
});

const loading = ref(false);

const editMode = ref(flow.value?.operations.length === 0 || props.operationId !== undefined);

const confirmDelete = ref(false);
const deleting = ref(false);

async function deleteFlow() {
	if (!flow.value?.id || deleting.value) return;

	deleting.value = true;

	try {
		await api.delete(`/flows/${flow.value.id}`);
		await flowsStore.hydrate();
	} catch (error) {
		unexpectedError(error);
	} finally {
		deleting.value = false;
		router.push('/settings/flows');
	}
}

// ------------- Manage Panels ------------- //

const { operations } = useExtensions();

const triggerDetailOpen = ref(false);
const stagedPanels = ref<Partial<OperationRaw & { borderRadius: [boolean, boolean, boolean, boolean] }>[]>([]);
const panelsToBeDeleted = ref<string[]>([]);
const hoveredPanelID = ref<string | null>(null);

const savedPanels = computed(() =>
	(flow.value?.operations || []).filter((panel) => panelsToBeDeleted.value.includes(panel.id) === false),
);

const resolveReferences = computed(() => {
	const references = new Map();

	for (const savedPanel of flow.value?.operations ?? []) {
		if (savedPanel.resolve && savedPanel.id) {
			references.set(savedPanel.resolve, savedPanel.id);
		}
	}

	return references;
});

const rejectReferences = computed(() => {
	const references = new Map();

	for (const savedPanel of flow.value?.operations ?? []) {
		if (savedPanel.reject && savedPanel.id) {
			references.set(savedPanel.reject, savedPanel.id);
		}
	}

	return references;
});

const panels = computed(() => {
	const raw = [
		...savedPanels.value.map((panel) => {
			const updates = stagedPanels.value.find((updatedPanel) => updatedPanel.id === panel.id);

			if (updates) {
				return Object.assign({}, panel, updates);
			}

			return panel;
		}),
		...stagedPanels.value.filter((panel) => panel.id?.startsWith('_')),
	];

	const panels: Record<string, any>[] = raw.map((panel) => ({
		...panel,
		width: PANEL_WIDTH,
		height: PANEL_HEIGHT,
		x: panel.position_x,
		y: panel.position_y,
		panel_name: operations.value.find((operation) => operation.id === panel.type)?.name,
	}));

	const trigger: Record<string, any> = {
		id: '$trigger',
		panel_name: t('trigger'),
		icon: 'offline_bolt',
		x: 1,
		y: 1,
		width: PANEL_WIDTH,
		height: PANEL_HEIGHT,
		showHeader: true,
		draggable: false,
		flow: props.primaryKey,
		type: flow.value?.trigger,
		options: flow.value?.options,
	};

	if (flow.value?.operation) trigger.resolve = flow.value.operation;

	panels.push(trigger);

	return panels;
});

const currentOperation = computed(() => {
	return panels.value.find((panel) => {
		return panel.id === props.operationId;
	});
});

const existingOperationKeys = computed(() => [
	...(flow.value?.operations || [])
		.filter((operation) => !panelsToBeDeleted.value.includes(operation.id))
		.map((operation) => operation.key),
	...stagedPanels.value.filter((stagedPanel) => stagedPanel.key !== undefined).map((stagedPanel) => stagedPanel.key!),
]);

const parentPanels = computed(() => {
	const parents = panels.value.reduce<Record<string, ParentInfo>>((acc, panel) => {
		if (panel.resolve) {
			acc[panel.resolve] = {
				id: panel.id,
				type: 'resolve',
				loner: true,
			};
		}

		if (panel.reject) {
			acc[panel.reject] = {
				id: panel.id,
				type: 'reject',
				loner: true,
			};
		}

		return acc;
	}, {});

	return Object.fromEntries(
		Object.entries(parents).map(([key, value]) => {
			return [key, { ...value, loner: !connectedToTrigger(key) }];
		}),
	);

	function connectedToTrigger(id: string) {
		let parent = parents[id];

		while (parent?.id !== '$trigger') {
			if (parent === undefined) return false;
			parent = parents[parent.id];
		}

		return true;
	}
});

let parentId: string | undefined = undefined;
let attachType: 'resolve' | 'reject' | undefined = undefined;

function stageOperationEdits(event: { edits: Partial<OperationRaw>; id?: string }) {
	const key = event.id ?? props.operationId;

	if (key === '+') {
		const attach: Record<string, any> = {};
		const tempId = `_${nanoid()}`;

		if (parentId !== undefined && attachType !== undefined) {
			const parent = panels.value.find((panel) => panel.id === parentId);

			if (parent) {
				if (parentId === '$trigger') {
					stagedFlow.value = { ...stagedFlow.value, operation: tempId };
				} else {
					stageOperationEdits({ edits: { [attachType]: tempId }, id: parentId });
				}

				if (attachType === 'resolve') {
					attach.position_x = parent.x + PANEL_WIDTH + 4;
					attach.position_y = parent.y;
				} else {
					attach.position_x = parent.x + PANEL_WIDTH + 4;
					attach.position_y = parent.y + PANEL_HEIGHT + 2;
				}
			}
		}

		stagedPanels.value = [
			...stagedPanels.value,
			{
				id: tempId,
				flow: props.primaryKey,
				position_x: 15,
				position_y: 15,
				...event.edits,
				...attach,
			},
		];
	} else {
		if (stagedPanels.value.some((panel) => panel.id === key)) {
			stagedPanels.value = stagedPanels.value.map((panel) => {
				if (panel.id === key) {
					return Object.assign({ id: key, flow: props.primaryKey }, panel, event.edits);
				}

				return panel;
			});
		} else {
			stagedPanels.value = [...stagedPanels.value, { id: key, flow: props.primaryKey, ...event.edits }];
		}
	}
}

function stageOperation(edits: Partial<OperationRaw>) {
	stageOperationEdits({ edits });
	parentId = undefined;
	attachType = undefined;
	router.replace(`/settings/flows/${props.primaryKey}`);
}

function cancelOperation() {
	parentId = undefined;
	attachType = undefined;
	router.replace(`/settings/flows/${props.primaryKey}`);
}

async function saveChanges() {
	const trees = getTrees().map(addChangesToTree);

	if (!flow.value) return;

	if (stagedPanels.value.length === 0 && panelsToBeDeleted.value.length === 0 && isEmpty(stagedFlow.value)) {
		editMode.value = false;
		return;
	}

	saving.value = true;

	try {
		if (trees.length > 0) {
			const changes: Record<string, any> = {
				...stagedFlow.value,
				operations: {
					create: trees.filter((tree) => !('id' in tree)),
					update: trees.filter((tree) => 'id' in tree && tree.id !== '$trigger'),
					delete: panelsToBeDeleted.value,
				},
			};

			const trigger = trees.find((tree) => tree.id === '$trigger');

			if (trigger && trigger.resolve !== undefined) changes.operation = trigger.resolve;

			const operationReferenceResetUpdates = [];

			/**
			 * Prevents the following from occuring:
			 *
			 * Existing A -> B re-linked to A -> C -> B via new panel
			 * not nullifying A -> B link before attempting to link C -> B
			 *
			 * Existing A -> B -> C re-linked to A -> C via delete
			 * not nullifying B -> C link before attempting to link A -> C
			 */
			for (const stagedPanel of stagedPanels.value) {
				if (stagedPanel.resolve && !stagedPanel.resolve.startsWith('_')) {
					const resolve = resolveReferences.value.get(stagedPanel.resolve);

					if (resolve && resolve !== stagedPanel.id) {
						operationReferenceResetUpdates.push({ id: resolve, resolve: null });
					}
				}

				if (stagedPanel.reject && !stagedPanel.reject.startsWith('_')) {
					const reject = rejectReferences.value.get(stagedPanel.reject);

					if (reject && reject !== stagedPanel.id) {
						operationReferenceResetUpdates.push({ id: reject, reject: null });
					}
				}
			}

			if (operationReferenceResetUpdates.length) {
				await api.patch(`/operations`, operationReferenceResetUpdates);
			}

			await api.patch(`/flows/${props.primaryKey}`, changes);
		}

		await flowsStore.hydrate();

		stagedPanels.value = [];
		panelsToBeDeleted.value = [];
		stagedFlow.value = {};
		editMode.value = false;
	} catch (error) {
		unexpectedError(error);
	} finally {
		saving.value = false;
	}
}

type Tree = {
	id: string;
	reject?: Tree;
	resolve?: Tree;
};

function getTrees() {
	const rejectResolveIds = panels.value.reduce<Set<string>>((acc, panel) => {
		if (panel.resolve) acc.add(panel.resolve);
		if (panel.reject) acc.add(panel.reject);
		return acc;
	}, new Set());

	const topOperations = panels.value.filter((panel) => !rejectResolveIds.has(panel.id));
	const trees = topOperations.map(constructTree);

	return trees;

	function constructTree(root: Record<string, any>): Tree {
		const resolve = panels.value.find((panel) => panel.id === root.resolve);
		const reject = panels.value.find((panel) => panel.id === root.reject);

		return {
			id: root.id,
			reject: reject ? constructTree(reject) : undefined,
			resolve: resolve ? constructTree(resolve) : undefined,
		};
	}
}

function addChangesToTree(tree: Tree): Record<string, any> {
	const edits = stagedPanels.value.find((panel) => panel.id === tree.id);

	const newTree = edits ? cloneDeep(edits) : ({ id: tree.id } as Record<string, any>);

	if (tree.reject) newTree.reject = addChangesToTree(tree.reject);
	if (tree.resolve) newTree.resolve = addChangesToTree(tree.resolve);
	if (tree.id.startsWith('_')) delete newTree.id;
	newTree.flow = props.primaryKey;

	return newTree;
}

async function deletePanel(id: string) {
	if (!flow.value) return;

	stagedPanels.value = stagedPanels.value.filter((panel) => panel.id !== id);

	if (!id.startsWith('_')) {
		panelsToBeDeleted.value.push(id);
	}

	if (flow.value.operation === id) {
		stagedFlow.value = { operation: null };
	} else {
		const parent = parentPanels.value[id];

		if (parent) {
			stageOperationEdits({ edits: { [parent.type]: null }, id: parent.id });
		}
	}
}

function createPanel(parent: string, type: 'resolve' | 'reject') {
	parentId = parent;
	attachType = type;
	router.push(`/settings/flows/${props.primaryKey}/+`);
}

function duplicatePanel(panel: OperationRaw) {
	const newPanel = omit(merge({}, panel), 'id', 'resolve', 'reject');
	const newKey = customAlphabet('abcdefghijklmnopqrstuvwxyz', 5)();
	newPanel.position_x = newPanel.position_x + 2;
	newPanel.position_y = newPanel.position_y + 2;
	newPanel.key = `${newPanel.key}_${newKey}`;
	stageOperationEdits({ edits: newPanel, id: '+' });
}

function editPanel(panel: AppTile) {
	if (panel.id === '$trigger') triggerDetailOpen.value = true;
	else router.push(`/settings/flows/${props.primaryKey}/${panel.id}`);
}

// ------------- Copy Panel To ------------- //

const copyPanelId = ref<string | undefined>();
const copyPanelTo = ref<string | undefined>();
const copyPanelLoading = ref(false);

const copyPanelChoices = computed(() => flowsStore.flows.filter((flow) => flow.id !== props.primaryKey));

async function copyPanel() {
	if (copyPanelLoading.value || copyPanelChoices.value.length === 0) return;

	copyPanelLoading.value = true;

	const currentPanel = panels.value.find((panel) => panel.id === copyPanelId.value);

	try {
		await api.post(`/operations`, {
			...omit(currentPanel, ['id', 'date_created', 'user_created', 'resolve', 'reject']),
			flow: copyPanelTo.value,
		});

		await flowsStore.hydrate();

		copyPanelId.value = undefined;
	} catch (error) {
		unexpectedError(error);
	} finally {
		copyPanelLoading.value = false;
	}
}

// ------------- Drag&Drop Arrows ------------- //

const arrowInfo = ref<ArrowInfo | undefined>();

function arrowMove(info: ArrowInfo) {
	arrowInfo.value = info;
}

function arrowStop() {
	if (!arrowInfo.value) {
		arrowInfo.value = undefined;
		return;
	}

	const nearPanel = getNearAttachment(arrowInfo.value?.pos);

	if (nearPanel && isLoop(arrowInfo.value.id, nearPanel)) {
		arrowInfo.value = undefined;
		return;
	}

	// make sure only one arrow can be connected to an attachment
	const currentlyConnected = nearPanel && parentPanels.value[nearPanel];

	if (currentlyConnected) {
		if (currentlyConnected.id === '$trigger') {
			flow.value = merge({}, flow.value, { operation: null });
		} else {
			stageOperationEdits({
				edits: {
					[currentlyConnected.type]: null,
				},
				id: currentlyConnected.id,
			});
		}
	}

	if (arrowInfo.value.id === '$trigger') {
		flow.value = merge({}, flow.value, { operation: nearPanel ?? null });
	} else {
		stageOperationEdits({
			edits: {
				[arrowInfo.value.type]: nearPanel ?? null,
			},
			id: arrowInfo.value.id,
		});
	}

	arrowInfo.value = undefined;
}

function isLoop(currentId: string, attachTo: string) {
	let parent: string | undefined = currentId;

	while (parent !== undefined) {
		if (parent === attachTo) return true;
		parent = parentPanels.value[parent]?.id;
	}

	return false;
}

function getNearAttachment(pos: Vector2) {
	for (const panel of panels.value) {
		const attachmentPos = new Vector2(
			(panel.x - 1) * 20 + ATTACHMENT_OFFSET.x,
			(panel.y - 1) * 20 + ATTACHMENT_OFFSET.y,
		);

		if (attachmentPos.distanceTo(pos) <= 40) return panel.id as string;
	}

	return undefined;
}

// ------------- Navigation Guard ------------- //

const hasEdits = computed(() => stagedPanels.value.length > 0 || panelsToBeDeleted.value.length > 0);

const { confirmLeave, leaveTo } = useEditsGuard(hasEdits, {
	ignorePrefix: computed(() => `/settings/flows/${props.primaryKey}`),
});

const confirmCancel = ref(false);

function attemptCancelChanges(): void {
	if (hasEdits.value) {
		confirmCancel.value = true;
	} else {
		cancelChanges();
	}
}

function cancelChanges() {
	confirmCancel.value = false;
	stagedPanels.value = [];
	stagedFlow.value = {};
	panelsToBeDeleted.value = [];
	editMode.value = false;
}

function discardAndLeave() {
	if (!leaveTo.value) return;
	cancelChanges();
	confirmLeave.value = false;
	router.push(leaveTo.value);
}
</script>

<template>
	<settings-not-found v-if="!flow && !loading" />
	<private-view v-else :title="flow?.name ?? $t('loading')" show-back>
		<template #headline>
			<v-breadcrumb :items="[{ name: $t('flows'), to: '/settings/flows' }]" />
		</template>

		<template #title:append>
			<display-color
				v-tooltip="flow?.status === 'active' ? $t('active') : $t('inactive')"
				class="status-dot"
				:value="flow?.status === 'active' ? 'var(--theme--primary)' : 'var(--theme--foreground-subdued)'"
			/>
		</template>

		<template #actions>
			<template v-if="editMode">
				<PrivateViewHeaderBarActionButton
					v-tooltip.bottom="$t('clear_changes')"
					class="clear-changes"
					icon="clear"
					outlined
					@click="attemptCancelChanges"
				/>

				<PrivateViewHeaderBarActionButton
					v-tooltip.bottom="$t('save')"
					:loading="saving"
					icon="check"
					@click="saveChanges"
				/>
			</template>

			<template v-else>
				<PrivateViewHeaderBarActionButton
					v-tooltip.bottom="$t('delete_flow')"
					class="delete-flow"
					secondary
					icon="delete"
					@click="confirmDelete = true"
				/>

				<PrivateViewHeaderBarActionButton
					v-tooltip.bottom="$t('edit_flow')"
					outlined
					icon="edit"
					@click="editMode = !editMode"
				/>
			</template>
		</template>

		<template #sidebar>
			<logs-sidebar-detail v-if="flow" :flow="flow" />
		</template>

		<template #navigation>
			<settings-navigation />
		</template>

		<div v-if="loading || !flow" class="container center">
			<v-progress-circular indeterminate />
		</div>
		<div v-else class="container">
			<arrows
				:panels="panels"
				:arrow-info="arrowInfo"
				:parent-panels="parentPanels"
				:edit-mode="editMode"
				:hovered-panel="hoveredPanelID"
				:subdued="flow.status === 'inactive'"
			/>
			<v-workspace :tiles="panels" :edit-mode="editMode">
				<template #tile="{ tile }">
					<operation
						v-if="flow"
						:edit-mode="editMode"
						:panel="tile"
						:type="tile.id === '$trigger' ? 'trigger' : 'operation'"
						:parent="parentPanels[tile.id]"
						:flow="flow"
						:panels-to-be-deleted="panelsToBeDeleted"
						:is-hovered="hoveredPanelID === tile.id"
						:subdued="flow.status === 'inactive'"
						@create="createPanel"
						@edit="editPanel"
						@move="copyPanelId = $event"
						@update="stageOperationEdits"
						@delete="deletePanel"
						@duplicate="duplicatePanel"
						@arrow-move="arrowMove"
						@arrow-stop="arrowStop"
						@show-hint="hoveredPanelID = $event"
						@hide-hint="hoveredPanelID = null"
						@flow-status="stagedFlow.status = $event"
					/>
				</template>
			</v-workspace>
		</div>

		<flow-drawer
			v-if="flow"
			:active="triggerDetailOpen"
			:primary-key="flow.id"
			:start-tab="'trigger_setup'"
			@cancel="triggerDetailOpen = false"
			@done="triggerDetailOpen = false"
		/>

		<v-dialog v-model="confirmLeave" @esc="confirmLeave = false" @apply="discardAndLeave">
			<v-card>
				<v-card-title>{{ $t('unsaved_changes') }}</v-card-title>
				<v-card-text>{{ $t('unsaved_changes_copy') }}</v-card-text>
				<v-card-actions>
					<v-button secondary @click="discardAndLeave">{{ $t('discard_changes') }}</v-button>
					<v-button @click="confirmLeave = false">{{ $t('keep_editing') }}</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<v-dialog v-model="confirmCancel" @esc="confirmCancel = false" @apply="cancelChanges">
			<v-card>
				<v-card-title>{{ $t('unsaved_changes') }}</v-card-title>
				<v-card-text>{{ $t('discard_changes_copy') }}</v-card-text>
				<v-card-actions>
					<v-button secondary @click="cancelChanges">{{ $t('discard_changes') }}</v-button>
					<v-button @click="confirmCancel = false">{{ $t('keep_editing') }}</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<v-dialog :model-value="confirmDelete" @esc="confirmDelete = false" @apply="deleteFlow">
			<v-card>
				<v-card-title>{{ $t('flow_delete_confirm', { flow: flow?.name }) }}</v-card-title>

				<v-card-actions>
					<v-button secondary @click="confirmDelete = false">{{ $t('cancel') }}</v-button>
					<v-button danger :loading="deleting" @click="deleteFlow">{{ $t('delete_label') }}</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<v-dialog
			:model-value="!!copyPanelId"
			@update:model-value="copyPanelId = undefined"
			@esc="copyPanelId = undefined"
			@apply="copyPanel"
		>
			<v-card>
				<v-card-title>{{ $t('copy_to') }}</v-card-title>

				<v-card-text>
					<v-notice v-if="copyPanelChoices.length === 0">
						{{ $t('no_other_flows_copy') }}
					</v-notice>
					<v-select v-else v-model="copyPanelTo" :items="copyPanelChoices" item-text="name" item-value="id" />
				</v-card-text>

				<v-card-actions>
					<v-button secondary @click="copyPanelId = undefined">
						{{ $t('cancel') }}
					</v-button>
					<v-button :loading="copyPanelLoading" :disabled="copyPanelChoices.length === 0" @click="copyPanel">
						{{ $t('copy') }}
					</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<router-view
			:operation="currentOperation"
			:existing-operation-keys="existingOperationKeys"
			:flow="flow"
			@save="stageOperation"
			@cancel="cancelOperation"
		/>
	</private-view>
</template>

<style scoped lang="scss">
.header-icon {
	--v-button-background-color: var(--theme--primary-background);
	--v-button-color: var(--theme--primary);
	--v-button-background-color-hover: var(--theme--primary-subdued);
	--v-button-color-hover: var(--theme--primary);
}

.status-dot {
	margin-inline-start: 6px;
}

.container {
	--column-size: 200px;
	--row-size: 100px;
	--gap-size: 40px;

	padding-block-start: calc(var(--content-padding) / 2);

	&.center {
		block-size: calc(100% - 48px - var(--header-bar-height));
		display: grid;
		place-items: center;
	}
}

.clear-changes {
	--v-button-background-color: var(--theme--foreground-subdued);
	--v-button-background-color-hover: var(--theme--foreground);
}

.delete-flow {
	--v-button-background-color-hover: var(--theme--danger) !important;
	--v-button-color-hover: var(--white) !important;
}

.grid {
	display: grid;
	grid-template-rows: repeat(auto-fit, var(--row-size));
	grid-template-columns: repeat(auto-fit, var(--column-size));
	gap: var(--gap-size);
	min-inline-size: calc(var(--column-size) * 2);
	min-block-size: calc(var(--row-size) * 2);
}
</style>
