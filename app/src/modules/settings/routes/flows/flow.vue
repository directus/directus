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

				<v-button v-tooltip.bottom="t('create_panel')" rounded icon outlined :to="`/flows/${currentFlow.id}/+`">
					<v-icon name="add" />
				</v-button>

				<v-button v-tooltip.bottom="t('save')" rounded icon :loading="saving" @click="saveChanges">
					<v-icon name="check" />
				</v-button>
			</template>

			<template v-else>
				<v-button
					v-tooltip.bottom="t('fit_to_screen')"
					:active="zoomToFit"
					class="zoom-to-fit"
					rounded
					icon
					outlined
					@click="toggleZoomToFit"
				>
					<v-icon name="aspect_ratio" />
				</v-button>

				<v-button
					v-tooltip.bottom="t('full_screen')"
					:active="fullScreen"
					class="fullscreen"
					rounded
					icon
					outlined
					@click="toggleFullScreen"
				>
					<v-icon name="fullscreen" />
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
			<v-workspace
				v-else
				:panels="panels"
				:edit-mode="editMode"
				:resizable="false"
				@edit="editPanel"
				@update="stagePanelEdits"
				@move="movePanelID = $event"
				@delete="deletePanel"
				@duplicate="duplicatePanel"
			>
				<template #default="props">
					<step-block :type="props.panel.type" />
				</template>
			</v-workspace>
		</div>

		<v-dialog v-model="confirmLeave" @esc="confirmLeave = false">
			<v-card>
				<v-card-title>{{ t('unsaved_changes') }}</v-card-title>
				<v-card-text>{{ t('unsaved_changes_copy') }}</v-card-text>
				<v-card-actions>
					<v-button secondary @click="discardAndLeave">
						{{ t('discard_changes') }}
					</v-button>
					<v-button @click="confirmLeave = false">{{ t('keep_editing') }}</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<v-dialog v-model="confirmCancel" @esc="confirmCancel = false">
			<v-card>
				<v-card-title>{{ t('unsaved_changes') }}</v-card-title>
				<v-card-text>{{ t('discard_changes_copy') }}</v-card-text>
				<v-card-actions>
					<v-button secondary @click="cancelChanges">
						{{ t('discard_changes') }}
					</v-button>
					<v-button @click="confirmCancel = false">{{ t('keep_editing') }}</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</private-view>
</template>

<script lang="ts">
import { FlowRaw, OperationRaw } from '@directus/shared/types';
import { useI18n } from 'vue-i18n';

import { defineComponent, computed, ref, toRefs, watch } from 'vue';
import { useAppStore } from '@/stores';
import { unexpectedError } from '@/utils/unexpected-error';
import api from '@/api';
import useShortcut from '@/composables/use-shortcut';
import { onBeforeRouteUpdate, onBeforeRouteLeave, NavigationGuard } from 'vue-router';
import { merge, omit } from 'lodash';
import { router } from '@/router';
import { pointOnLine } from '@/utils/point-on-line';
import { nanoid } from 'nanoid';

import SettingsNotFound from '../not-found.vue';
import SettingsNavigation from '../../components/navigation.vue';
import StepBlock from './components/step-block.vue';

const PANEL_WIDTH = 20;
const PANEL_HEIGHT = 10;

export default defineComponent({
	name: 'FlowsDashboard',
	components: { SettingsNotFound, SettingsNavigation, StepBlock },
	props: {
		primaryKey: {
			type: String,
			required: true,
		},
		panelKey: {
			type: String,
			default: null,
		},
	},
	setup(props) {
		const { t } = useI18n();

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

		const now = new Date();

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

			const withCoords = raw.map((panel) => ({
				...panel,
				_coordinates: [
					[panel.position_x!, panel.position_y!],
					[panel.position_x! + PANEL_WIDTH!, panel.position_y!],
					[panel.position_x! + PANEL_WIDTH!, panel.position_y! + PANEL_HEIGHT!],
					[panel.position_x!, panel.position_y! + PANEL_HEIGHT!],
				] as [number, number][],
			}));

			const withBorderRadii = withCoords.map((panel) => {
				let topLeftIntersects = false;
				let topRightIntersects = false;
				let bottomRightIntersects = false;
				let bottomLeftIntersects = false;

				for (const otherPanel of withCoords) {
					if (otherPanel.id === panel.id) continue;

					const borders = [
						[otherPanel._coordinates[0], otherPanel._coordinates[1]],
						[otherPanel._coordinates[1], otherPanel._coordinates[2]],
						[otherPanel._coordinates[2], otherPanel._coordinates[3]],
						[otherPanel._coordinates[3], otherPanel._coordinates[0]],
					];

					if (topLeftIntersects === false)
						topLeftIntersects = borders.some(([p1, p2]) => pointOnLine(panel._coordinates[0], p1, p2));
					if (topRightIntersects === false)
						topRightIntersects = borders.some(([p1, p2]) => pointOnLine(panel._coordinates[1], p1, p2));
					if (bottomRightIntersects === false)
						bottomRightIntersects = borders.some(([p1, p2]) => pointOnLine(panel._coordinates[2], p1, p2));
					if (bottomLeftIntersects === false)
						bottomLeftIntersects = borders.some(([p1, p2]) => pointOnLine(panel._coordinates[3], p1, p2));
				}

				return {
					...panel,
					show_header: true,
					icon: 'account_tree',
					width: PANEL_WIDTH,
					height: PANEL_HEIGHT,
					borderRadius: [!topLeftIntersects, !topRightIntersects, !bottomRightIntersects, !bottomLeftIntersects],
				};
			});

			return withBorderRadii;
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

		return {
			loading,
			currentFlow,
			editMode,
			panels,
			stagePanelEdits,
			stagedPanels,
			saving,
			saveChanges,
			stageConfiguration,
			movePanelID,
			deletePanel,
			attemptCancelChanges,
			duplicatePanel,
			editPanel,
			movePanelLoading,
			t,
			toggleFullScreen,
			zoomToFit,
			fullScreen,
			toggleZoomToFit,
			confirmLeave,
			discardAndLeave,
			now,
			confirmCancel,
			cancelChanges,
		};

		function stagePanelEdits(event: { edits: Partial<OperationRaw>; id?: string }) {
			const key = event.id ?? props.panelKey;

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

		function duplicatePanel(panel: OperationRaw) {
			const newPanel = omit(merge({}, panel), 'id');
			newPanel.position_x = newPanel.position_x + 2;
			newPanel.position_y = newPanel.position_y + 2;
			stagePanelEdits({ edits: newPanel, id: '+' });
		}

		function editPanel(panel: OperationRaw) {
			// router.push(`/flows/${panel.flow}/${panel.id}`);
		}

		function toggleFullScreen() {
			fullScreen.value = !fullScreen.value;
		}

		function toggleZoomToFit() {
			zoomToFit.value = !zoomToFit.value;
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
	},
});
</script>

<style scoped>
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
