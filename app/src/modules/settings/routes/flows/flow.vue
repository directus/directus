<template>
	<settings-not-found v-if="!flow" />
	<private-view v-else :title="flow?.name ?? t('loading')">
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded disabled icon secondary>
				<v-icon :name="flow?.icon ?? 'account_tree'" />
			</v-button>
		</template>

		<template #headline>
			<v-breadcrumb :items="[{ name: t('flows'), to: '/flows' }]" />
		</template>

		<template #actions>
			<template v-if="editMode">
				<v-button
					v-tooltip.bottom="t('clear_changes')"
					class="clear-changes"
					rounded
					icon
					outlined
					@click="attemptCancelChanges"
				>
					<v-icon name="clear" />
				</v-button>

				<v-button
					v-tooltip.bottom="t('create_panel')"
					rounded
					icon
					outlined
					:to="`/settings/flows/${primaryKey}/+`"
				>
					<v-icon name="add" />
				</v-button>

				<v-button v-tooltip.bottom="t('save')" rounded icon :loading="saving" @click="saveChanges">
					<v-icon name="check" />
				</v-button>
			</template>

			<template v-else>
				<v-button v-tooltip.bottom="t('delete_flow')" rounded icon secondary @click="deleteFlow">
					<v-icon name="delete" />
				</v-button>

				<v-button
					v-tooltip.bottom="t('full_screen')"
					class="fullscreen"
					rounded
					icon
					secondary
					@click="startDebug"
				>
					<v-icon name="slow_motion_video" />
				</v-button>

				<v-button
					v-tooltip.bottom="t('edit_panels')"
					rounded
					icon
					outlined
					@click="editMode = !editMode"
				>
					<v-icon name="edit" />
				</v-button>
			</template>
		</template>

		<template #sidebar>
			<sidebar-detail icon="info_outline" :title="t('information')" close>
				<div v-md="t('page_help_settings_flows_item')" class="page-description" />
			</sidebar-detail>
		</template>

		<template #navigation>
			<settings-navigation />
		</template>

		<div class="container">
			<v-workspace :panels="panels" :edit-mode="editMode">
				<template #panel="{ panel }">
					<operation
						:edit-mode="editMode"
						:panel="panel"
						:type="panel.id === '$trigger' ? 'trigger' : 'operation'"
						@create="createPanel"
						@edit="editPanel"
						@update="stageOperationEdits"
						@delete="deletePanel"
						@duplicate="duplicatePanel"
					/>
				</template>
			</v-workspace>
		</div>

		<trigger-detail v-model:open="triggerDetailOpen" v-model:flow="flow" />

		<v-dialog v-model="confirmLeave" @esc="confirmLeave = false">
			<v-card>
				<v-card-title>{{ t('unsaved_changes') }}</v-card-title>
				<v-card-text>{{ t('unsaved_changes_copy') }}</v-card-text>
				<v-card-actions>
					<v-button secondary @click="discardAndLeave">{{ t('discard_changes') }}</v-button>
					<v-button @click="confirmLeave = false">{{ t('keep_editing') }}</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<v-dialog v-model="confirmCancel" @esc="confirmCancel = false">
			<v-card>
				<v-card-title>{{ t('unsaved_changes') }}</v-card-title>
				<v-card-text>{{ t('discard_changes_copy') }}</v-card-text>
				<v-card-actions>
					<v-button secondary @click="cancelChanges">{{ t('discard_changes') }}</v-button>
					<v-button @click="confirmCancel = false">{{ t('keep_editing') }}</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<router-view @save="stageOperation" @cancel="$router.replace(`/settings/flows/${primaryKey}`)" />
	</private-view>
</template>

<script setup lang="ts">
import { FlowRaw, OperationRaw } from '@directus/shared/types';
import { useI18n } from 'vue-i18n';

import { computed, ref, toRefs, watch } from 'vue';
import { useFlowsStore } from '@/stores';
import { unexpectedError } from '@/utils/unexpected-error';
import api from '@/api';
import useShortcut from '@/composables/use-shortcut';
import { onBeforeRouteUpdate, onBeforeRouteLeave, NavigationGuard } from 'vue-router';
import { merge, omit } from 'lodash';
import { router } from '@/router';
import { nanoid } from 'nanoid';

import SettingsNotFound from '../not-found.vue';
import SettingsNavigation from '../../components/navigation.vue';
import Operation from './components/operation.vue';
import { AppPanel } from '@/components/v-workspace-panel.vue';
import TriggerDetail from './components/trigger-detail.vue';

const { t } = useI18n();

const PANEL_WIDTH = 14
const PANEL_HEIGHT = 14

const props = defineProps<{
	primaryKey: string;
	operationId?: string;
}>();

const { primaryKey } = toRefs(props);

const editMode = ref(false);
const saving = ref(false);

let parentId: string | undefined = undefined
let attachType: 'resolve' | 'reject' | undefined = undefined

const zoomToFit = ref(false);

useShortcut('meta+s', () => {
	saveChanges();
});

watch(editMode, (editModeEnabled) => {
	if (editModeEnabled) {
		zoomToFit.value = false;
		window.onbeforeunload = () => '';
	} else {
		window.onbeforeunload = null;
	}
});

const triggerDetailOpen = ref(false)

const flowsStore = useFlowsStore()

const stagedFlow = ref<Partial<FlowRaw>>({})
const flow = computed<FlowRaw | undefined>({
	get() {
		const existing = flowsStore.flows.find(flow => flow.id === primaryKey.value)
		return merge({}, existing, stagedFlow.value)
	},
	set(newFlow) {
		stagedFlow.value = newFlow ?? {}
	}
})

const stagedPanels = ref<Partial<OperationRaw & { borderRadius: [boolean, boolean, boolean, boolean] }>[]>([]);
const panelsToBeDeleted = ref<string[]>([]);

const panels = computed(() => {
	const savedPanels = (flow.value?.operations || []).filter(
		(panel) => panelsToBeDeleted.value.includes(panel.id) === false
	);

	const raw = [
		...savedPanels.map((panel) => {
			const updates = stagedPanels.value.find((updatedPanel) => updatedPanel.id === panel.id);

			if (updates) {
				return merge({}, panel, updates);
			}

			return panel;
		}),
		...stagedPanels.value.filter((panel) => panel.id?.startsWith('_')),
	];

	const panels: Record<string, any>[] = raw.map(
		(panel) =>
		({
			...panel,
			width: PANEL_WIDTH,
			height: PANEL_HEIGHT,
			x: panel.position_x,
			y: panel.position_y,
			name: t(`operations.${panel.type}.name`),
		})
	);

	const trigger: Record<string, any> = {
		id: '$trigger',
		name: t(`triggers.${flow.value?.trigger}.name`),
		icon: 'offline_bolt',
		x: 1,
		y: 1,
		width: PANEL_WIDTH,
		height: PANEL_HEIGHT,
		showHeader: true,
		draggable: false,
	}

	if(flow.value?.operation) trigger.resolve = flow.value.operation

	panels.push(trigger);

	return panels;
});

const confirmCancel = ref(false);
const confirmLeave = ref(false);
const leaveTo = ref<string | null>(null);

const editsGuard: NavigationGuard = (to) => {
	const hasEdits = panelsToBeDeleted.value.length > 0 || stagedPanels.value.length > 0;

	if (editMode.value && to.params.primaryKey !== props.primaryKey) {
		console.log(editMode.value, to.params.primaryKey , props.primaryKey)
		if (hasEdits) {
			confirmLeave.value = true;
			leaveTo.value = to.fullPath;
			return false;
		} else {
			editMode.value = false;
		}
	}
};

onBeforeRouteUpdate(editsGuard);
onBeforeRouteLeave(editsGuard);

function stageOperationEdits(event: { edits: Partial<OperationRaw>; id?: string }) {
	const key = event.id ?? props.operationId;

	if (key === '+') {
		const attach: Record<string, any> = {}
		const tempId = `_${nanoid()}`

		if(parentId !== undefined && attachType !== undefined) {
			const parent = panels.value.find(panel => panel.id === parentId)

			if(parent) {
				if(parentId === '$trigger') {
					stagedFlow.value = {...stagedFlow.value, operation: tempId}
				} else {
					stageOperationEdits({edits: {[attachType]: tempId}, id: parentId})
				}


				if(attachType === 'resolve') {
					attach.position_x = parent.x + PANEL_WIDTH + 5
					attach.position_y = parent.y
				} else {
					attach.position_x = parent.x
					attach.position_y = parent.y + PANEL_HEIGHT + 5
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
				...attach
			},
		];
	} else {
		if (stagedPanels.value.some((panel) => panel.id === key)) {
			stagedPanels.value = stagedPanels.value.map((panel) => {
				if (panel.id === key) {
					return merge({ id: key, flow: props.primaryKey }, panel, event.edits);
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
	router.replace(`/settings/flows/${props.primaryKey}`);
}

async function saveChanges() {
	if (!flow.value) return;

	if (stagedPanels.value.length === 0 && panelsToBeDeleted.value.length === 0) {
		editMode.value = false;
		return;
	}

	saving.value = true;

	try {
		if (stagedPanels.value.length > 0) {
			// TODO: Clean reject / resolve values
			const changes: Record<string, any> = {
				operations: {
					create: stagedPanels.value.filter((panel) => panel.id?.startsWith('_')).map((panel) => omit(panel, 'id')),
					update: stagedPanels.value.filter((panel) => !panel.id?.startsWith('_')),
					delete: panelsToBeDeleted.value
				},
			}

			if(flow.value.operation?.startsWith('_')) {
				changes.operation = stagedPanels.value.find((panel) => panel.id === flow.value?.operation)
			}

			await api.patch(`/flows/${props.primaryKey}`, changes);
		}

		await flowsStore.hydrate()

		stagedPanels.value = [];
		editMode.value = false;
	} catch (error) {
		unexpectedError(error as Error);
	} finally {
		saving.value = false;
	}
}

async function deletePanel(id: string) {
	if (!flow.value) return;

	stagedPanels.value = stagedPanels.value.filter((panel) => panel.id !== id);
	if (id.startsWith('_') === false) panelsToBeDeleted.value.push(id);
}

function attemptCancelChanges(): void {
	const hasEdits = stagedPanels.value.length > 0 || panelsToBeDeleted.value.length > 0;

	if (hasEdits) {
		confirmCancel.value = true;
	} else {
		cancelChanges();
	}
}

function cancelChanges() {
	confirmCancel.value = false;
	stagedPanels.value = [];
	panelsToBeDeleted.value = [];
	editMode.value = false;
}

function discardAndLeave() {
	if (!leaveTo.value) return;
	cancelChanges();
	confirmLeave.value = false;
	router.push(leaveTo.value);
}

function createPanel(parent: string, type: 'resolve' | 'reject') {
	parentId = parent
	attachType = type
	router.push(`/settings/flows/${props.primaryKey}/+`);
}

function duplicatePanel(panel: OperationRaw) {
	const newPanel = omit(merge({}, panel), 'id');
	newPanel.position_x = newPanel.position_x + 2;
	newPanel.position_y = newPanel.position_y + 2;
	stageOperationEdits({ edits: newPanel, id: '+' });
}

function editPanel(panel: AppPanel) {
	if (panel.id === '$trigger')
		triggerDetailOpen.value = true
	else
		router.push(`/settings/flows/${props.primaryKey}/${panel.id}`);
}

function startDebug() {
	// TODO: Start debugger
}

function deleteFlow() {
	// TODO: Delete flow
}
</script>

<style scoped lang="scss">
.header-icon {
	--v-button-color-disabled: var(--foreground-normal);
}

.container {
	--column-size: 200px;
	--row-size: 100px;
	--gap-size: 40px;

	padding: var(--content-padding);
}

.grid {
	display: grid;
	grid-template-rows: repeat(auto-fit, var(--row-size));
	grid-template-columns: repeat(auto-fit, var(--column-size));
	gap: var(--gap-size);
	min-width: calc(var(--column-size) * 2);
	min-height: calc(var(--row-size) * 2);
}
</style>
