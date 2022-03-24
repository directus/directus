<template>
	<settings-not-found v-if="!currentFlow && !loading" />
	<private-view v-else :title="currentFlow?.name ?? t('loading')">
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded disabled icon secondary>
				<v-icon :name="currentFlow?.icon ?? 'account_tree'" />
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

				<v-button v-tooltip.bottom="t('create_panel')" rounded icon outlined :to="`/settings/flows/${primaryKey}/+`">
					<v-icon name="add" />
				</v-button>

				<v-button v-tooltip.bottom="t('save')" rounded icon :loading="saving" @click="saveChanges">
					<v-icon name="check" />
				</v-button>
			</template>

			<template v-else>
				<v-button v-tooltip.bottom="t('delete')" rounded icon secondary @click="deleteFlow">
					<v-icon name="delete" />
				</v-button>

				<v-button
					v-tooltip.bottom="t('full_screen')"
					:active="fullScreen"
					class="fullscreen"
					rounded
					icon
					secondary
					@click="startDebug"
				>
					<v-icon name="slow_motion_video" />
				</v-button>

				<v-button v-tooltip.bottom="t('edit_panels')" rounded icon outlined @click="editMode = !editMode">
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
			<v-progress-circular v-if="loading" class="loading" indeterminate />
			<v-workspace v-else :panels="panels" :edit-mode="editMode">
				<template #panel="{ panel }">
					<operation
						:edit-mode="editMode"
						:panel="panel"
						type="trigger"
						@create="createPanel"
						@edit="editPanel"
						@update="stagePanelEdits"
						@move="movePanelID = $event"
						@delete="deletePanel"
						@duplicate="duplicatePanel"
					/>
				</template>
			</v-workspace>
		</div>

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

		<router-view />
	</private-view>
</template>

<script setup lang="ts">
import { FlowRaw, OperationRaw } from '@directus/shared/types';
import { useI18n } from 'vue-i18n';

import { computed, ref, toRefs, watch } from 'vue';
import { useAppStore } from '@/stores';
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

const { t } = useI18n();

const props = defineProps<{
	primaryKey: string;
}>();

const appStore = useAppStore();

const { fullScreen } = toRefs(appStore);
const { primaryKey } = toRefs(props);

const currentFlow = ref<FlowRaw>();
const loading = ref(true);

const editMode = ref(false);
const saving = ref(false);
const movePanelLoading = ref(false);

const movePanelID = ref<string | null>();

const zoomToFit = ref(false);

useShortcut('meta+s', () => {
	saveChanges();
});

watch(primaryKey, fetchFlow, { immediate: true });

watch(editMode, (editModeEnabled) => {
	if (editModeEnabled) {
		zoomToFit.value = false;
		window.onbeforeunload = () => '';
	} else {
		window.onbeforeunload = null;
	}
});

const stagedPanels = ref<Partial<OperationRaw & { borderRadius: [boolean, boolean, boolean, boolean] }>[]>([]);
const panelsToBeDeleted = ref<string[]>([]);

const panels = computed(() => {
	const savedPanels = (currentFlow.value?.operations || []).filter(
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

	const panels = raw.map(
		(panel) =>
			({
				...panel,
				width: 10,
				height: 10,
				x: panel.position_x,
				y: panel.position_y,
			} as AppPanel)
	);

	panels.push({
		id: '1',
		name: 'Trigger',
		x: 1,
		y: 1,
		width: 14,
		height: 14,
		showHeader: true,
		draggable: false,
	});

	return panels;
});

const confirmCancel = ref(false);
const confirmLeave = ref(false);
const leaveTo = ref<string | null>(null);

const editsGuard: NavigationGuard = (to) => {
	const hasEdits = panelsToBeDeleted.value.length > 0 || stagedPanels.value.length > 0;

	if (editMode.value && to.params.primaryKey !== props.primaryKey) {
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

function stagePanelEdits(event: { edits: Partial<OperationRaw>; id?: string }) {
	const key = event.id;

	if (key === '+') {
		stagedPanels.value = [
			...stagedPanels.value,
			{
				id: `_${nanoid()}`,
				flow: props.primaryKey,
				...event.edits,
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

function stageConfiguration(edits: Partial<OperationRaw>) {
	stagePanelEdits({ edits });
	router.replace(`/flows/${props.primaryKey}`);
}

async function saveChanges() {
	if (!currentFlow.value) return;

	if (stagedPanels.value.length === 0 && panelsToBeDeleted.value.length === 0) {
		editMode.value = false;
		return;
	}

	saving.value = true;

	const currentIDs = currentFlow.value.operations.map((panel) => panel.id);

	const updatedPanels = [
		...currentIDs.map((id) => {
			return stagedPanels.value.find((panel) => panel.id === id) || id;
		}),
		...stagedPanels.value.filter((panel) => panel.id?.startsWith('_')).map((panel) => omit(panel, 'id')),
	];

	try {
		if (stagedPanels.value.length > 0) {
			await api.patch(`/flows/${props.primaryKey}`, {
				operations: updatedPanels,
			});
		}

		if (panelsToBeDeleted.value.length > 0) {
			await api.delete(`/operations`, { data: panelsToBeDeleted.value });
		}

		fetchFlow();

		stagedPanels.value = [];
		editMode.value = false;
	} catch (err) {
		unexpectedError(err);
	} finally {
		saving.value = false;
	}
}

async function deletePanel(id: string) {
	if (!currentFlow.value) return;

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

function createPanel(type: 'resolve' | 'reject') {
	router.push(`/settings/flows/${props.primaryKey}/+`);
}

function duplicatePanel(panel: OperationRaw) {
	const newPanel = omit(merge({}, panel), 'id');
	newPanel.position_x = newPanel.position_x + 2;
	newPanel.position_y = newPanel.position_y + 2;
	stagePanelEdits({ edits: newPanel, id: '+' });
}

function editPanel(panel: OperationRaw) {
	router.push(`/settings/flows/${panel.flow}/${panel.id}`);
}

function startDebug() {
	// TODO: Start debugger
}

function deleteFlow() {
	// TODO: Delete flow
}

async function fetchFlow() {
	try {
		const response = await api.get(`/flows/${props.primaryKey}`, {
			params: {
				fields: '*.*',
			},
		});

		currentFlow.value = response.data.data;
	} catch (err: any) {
		unexpectedError(err);
	} finally {
		loading.value = false;
	}
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
