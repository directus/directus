<template>
	<insights-not-found v-if="!currentDashboard" />
	<private-view v-else :title="currentDashboard.name">
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded disabled icon secondary>
				<v-icon :name="currentDashboard.icon" />
			</v-button>
		</template>

		<template #headline>
			<v-breadcrumb :items="[{ name: t('insights'), to: '/insights' }]" />
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

				<v-button v-tooltip.bottom="t('create_panel')" rounded icon outlined :to="`/insights/${currentDashboard.id}/+`">
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
				<div v-md="t('page_help_insights_dashboard')" class="page-description" />
			</sidebar-detail>
		</template>

		<template #navigation>
			<insights-navigation />
		</template>

		<insights-workspace
			:edit-mode="editMode"
			:panels="panels"
			:zoom-to-fit="zoomToFit"
			:now="now"
			@update="stagePanelEdits"
			@move="movePanelID = $event"
			@delete="deletePanel"
			@duplicate="duplicatePanel"
		/>

		<router-view
			name="detail"
			:dashboard-key="primaryKey"
			:panel="panelKey ? panels.find((panel) => panel.id === panelKey) : null"
			@save="stageConfiguration"
			@cancel="$router.replace(`/insights/${primaryKey}`)"
		/>

		<v-dialog :model-value="!!movePanelID" @update:model-value="movePanelID = null" @esc="movePanelID = null">
			<v-card>
				<v-card-title>{{ t('copy_to') }}</v-card-title>

				<v-card-text>
					<v-notice v-if="movePanelChoices.length === 0">
						{{ t('no_other_dashboards_copy') }}
					</v-notice>
					<v-select v-else v-model="movePanelTo" :items="movePanelChoices" item-text="name" item-value="id" />
				</v-card-text>

				<v-card-actions>
					<v-button secondary @click="movePanelID = null">
						{{ t('cancel') }}
					</v-button>
					<v-button :loading="movePanelLoading" @click="movePanel">
						{{ t('copy') }}
					</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>

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
import InsightsNavigation from '../components/navigation.vue';
import { defineComponent, computed, ref, toRefs, watch } from 'vue';
import { useInsightsStore, useAppStore } from '@/stores';
import InsightsNotFound from './not-found.vue';
import { Panel } from '@directus/shared/types';
import { nanoid } from 'nanoid';
import { merge, omit } from 'lodash';
import { router } from '@/router';
import { unexpectedError } from '@/utils/unexpected-error';
import api from '@/api';
import { useI18n } from 'vue-i18n';
import { pointOnLine } from '@/utils/point-on-line';
import InsightsWorkspace from '../components/workspace.vue';
import { md } from '@/utils/md';
import { onBeforeRouteUpdate, onBeforeRouteLeave, NavigationGuard } from 'vue-router';
import useShortcut from '@/composables/use-shortcut';

export default defineComponent({
	name: 'InsightsDashboard',
	components: { InsightsNotFound, InsightsNavigation, InsightsWorkspace },
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

		const insightsStore = useInsightsStore();
		const appStore = useAppStore();

		const { fullScreen } = toRefs(appStore);

		const editMode = ref(false);
		const saving = ref(false);
		const movePanelLoading = ref(false);

		const movePanelTo = ref(insightsStore.dashboards.find((dashboard) => dashboard.id !== props.primaryKey)?.id);

		const movePanelID = ref<string | null>();

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

		const currentDashboard = computed(() =>
			insightsStore.dashboards.find((dashboard) => dashboard.id === props.primaryKey)
		);

		const movePanelChoices = computed(() => {
			return insightsStore.dashboards.filter((dashboard) => dashboard.id !== props.primaryKey);
		});

		const stagedPanels = ref<Partial<Panel & { borderRadius: [boolean, boolean, boolean, boolean] }>[]>([]);
		const panelsToBeDeleted = ref<string[]>([]);

		const now = new Date();

		const panels = computed(() => {
			const savedPanels = (currentDashboard.value?.panels || []).filter(
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
					[panel.position_x! + panel.width!, panel.position_y!],
					[panel.position_x! + panel.width!, panel.position_y! + panel.height!],
					[panel.position_x!, panel.position_y! + panel.height!],
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
			currentDashboard,
			editMode,
			panels,
			stagePanelEdits,
			stagedPanels,
			saving,
			saveChanges,
			stageConfiguration,
			movePanelID,
			movePanel,
			deletePanel,
			attemptCancelChanges,
			duplicatePanel,
			movePanelLoading,
			t,
			toggleFullScreen,
			zoomToFit,
			fullScreen,
			toggleZoomToFit,
			md,
			movePanelChoices,
			movePanelTo,
			confirmLeave,
			discardAndLeave,
			now,
			confirmCancel,
			cancelChanges,
		};

		function stagePanelEdits(event: { edits: Partial<Panel>; id?: string }) {
			const key = event.id ?? props.panelKey;

			if (key === '+') {
				stagedPanels.value = [
					...stagedPanels.value,
					{
						id: `_${nanoid()}`,
						dashboard: props.primaryKey,
						...event.edits,
					},
				];
			} else {
				if (stagedPanels.value.some((panel) => panel.id === key)) {
					stagedPanels.value = stagedPanels.value.map((panel) => {
						if (panel.id === key) {
							return merge({ id: key, dashboard: props.primaryKey }, panel, event.edits);
						}

						return panel;
					});
				} else {
					stagedPanels.value = [...stagedPanels.value, { id: key, dashboard: props.primaryKey, ...event.edits }];
				}
			}
		}

		function stageConfiguration(edits: Partial<Panel>) {
			stagePanelEdits({ edits });
			router.replace(`/insights/${props.primaryKey}`);
		}

		async function saveChanges() {
			if (!currentDashboard.value) return;

			if (stagedPanels.value.length === 0 && panelsToBeDeleted.value.length === 0) {
				editMode.value = false;
				return;
			}

			saving.value = true;

			const currentIDs = currentDashboard.value.panels.map((panel) => panel.id);

			const updatedPanels = [
				...currentIDs.map((id) => {
					return stagedPanels.value.find((panel) => panel.id === id) || id;
				}),
				...stagedPanels.value.filter((panel) => panel.id?.startsWith('_')).map((panel) => omit(panel, 'id')),
			];

			try {
				if (stagedPanels.value.length > 0) {
					await api.patch(`/dashboards/${props.primaryKey}`, {
						panels: updatedPanels,
					});
				}

				if (panelsToBeDeleted.value.length > 0) {
					await api.delete(`/panels`, { data: panelsToBeDeleted.value });
				}

				await insightsStore.hydrate();

				stagedPanels.value = [];
				editMode.value = false;
			} catch (err) {
				unexpectedError(err);
			} finally {
				saving.value = false;
			}
		}

		async function deletePanel(id: string) {
			if (!currentDashboard.value) return;

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

		function duplicatePanel(panel: Panel) {
			const newPanel = omit(merge({}, panel), 'id');
			newPanel.position_x = newPanel.position_x + 2;
			newPanel.position_y = newPanel.position_y + 2;
			stagePanelEdits({ edits: newPanel, id: '+' });
		}

		function toggleFullScreen() {
			fullScreen.value = !fullScreen.value;
		}

		function toggleZoomToFit() {
			zoomToFit.value = !zoomToFit.value;
		}

		async function movePanel() {
			movePanelLoading.value = true;

			const currentPanel = panels.value.find((panel) => panel.id === movePanelID.value);

			try {
				await api.post(`/panels`, {
					...omit(currentPanel, ['id']),
					dashboard: movePanelTo.value,
				});

				await insightsStore.hydrate();

				movePanelID.value = null;
			} catch (err) {
				unexpectedError(err);
			} finally {
				movePanelLoading.value = false;
			}
		}
	},
});
</script>

<style scoped>
.fullscreen,
.zoom-to-fit,
.clear-changes {
	--v-button-color: var(--foreground-normal);
	--v-button-color-hover: var(--foreground-normal);
	--v-button-background-color: var(--foreground-subdued);
	--v-button-background-color-hover: var(--foreground-normal);
	--v-button-color-active: var(--foreground-inverted);
	--v-button-background-color-active: var(--primary);
}

.header-icon {
	--v-button-color-disabled: var(--foreground-normal);
}
</style>
