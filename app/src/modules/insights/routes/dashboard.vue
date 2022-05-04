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

				<v-button
					v-tooltip.bottom="t('edit_panels')"
					class="edit"
					rounded
					icon
					outlined
					:disabled="!updateAllowed"
					@click="editMode = !editMode"
				>
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
			:panels="panelsWithData"
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
import { useInsightsStore, useAppStore, usePermissionsStore } from '@/stores';
import InsightsNotFound from './not-found.vue';
import { Panel } from '@directus/shared/types';
import { merge, omit, isEmpty } from 'lodash';
import { router } from '@/router';
import { unexpectedError } from '@/utils/unexpected-error';
import api from '@/api';
import { useI18n } from 'vue-i18n';
import { pointOnLine } from '@/utils/point-on-line';
import InsightsWorkspace from '../components/workspace.vue';
import { md } from '@/utils/md';
import { onBeforeRouteUpdate, onBeforeRouteLeave, NavigationGuard } from 'vue-router';
import useShortcut from '@/composables/use-shortcut';
import { getPanels } from '@/panels';
import { jsonToGraphQLQuery } from 'json-to-graphql-query';
import { objDiff } from '../../../utils/object-diff';
import { v4 as uuid } from 'uuid';

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
		const permissionsStore = usePermissionsStore();
		const { panels: panelTypes } = getPanels();
		const response = ref<Record<string, Panel>>({});
		const panelsWithData = ref([]);

		const { fullScreen } = toRefs(appStore);

		const editMode = ref(false);
		const saving = ref(false);
		const movePanelLoading = ref(false);

		const movePanelTo = ref(insightsStore.dashboards.find((dashboard) => dashboard.id !== props.primaryKey)?.id);

		const movePanelID = ref<string | null>();

		const zoomToFit = ref(false);

		const updateAllowed = computed<boolean>(() => {
			return permissionsStore.hasPermission('directus_panels', 'update');
		});

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
				...stagedPanels.value.filter((panel) => {
					const matchingPanels = savedPanels.find((existingPanel) => existingPanel.id === panel.id);
					if (isEmpty(matchingPanels)) return panel;
				}),
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

		const queryObject = computed<Record<string, any>>(() => {
			const queries = {};

			if (!isEmpty(stagedPanels.value)) {
				for (const panel of stagedPanels.value) {
					const type = panelTypes.value.find((panelType) => panelType.id === panel.type);
					if (type?.query) {
						const query = type.query(panel.options);
						queries[panel.id] = { collection: panel.options.collection, query };
					}
				}
			}
			if (!isEmpty(panels.value)) {
				for (const panel of panels.value) {
					const type = panelTypes.value.find((panelType) => panelType.id === panel.type);
					if (type?.query) {
						const query = type.query(panel.options);
						queries[panel.id] = { collection: panel.options.collection, query };
					}
				}
			}

			return queries;
		});

		watch(panels, () => {
			const newPanelsWithData = [];
			for (const panel of panels.value) {
				const panelId = 'id_' + panel.id.replaceAll('-', '_');

				if (response.value[panelId]) {
					const editablePanel = panel;

					editablePanel.data = response.value[panelId];
					newPanelsWithData.push(editablePanel);
				} else {
					newPanelsWithData.push(panel);
				}
			}
			panelsWithData.value = newPanelsWithData;
		});

		const gqlQueries = stitchQueriesToGql(queryObject.value);

		caller(gqlQueries);

		watch(queryObject, (newObj, obj) => {
			const newQueries = objDiff(newObj, obj);

			if (!isEmpty(newQueries)) {
				const gqlQueries = stitchQueriesToGql(newQueries);
				caller(gqlQueries);
			}
		});

		onBeforeRouteUpdate(editsGuard);
		onBeforeRouteLeave(editsGuard);

		return {
			currentDashboard,
			editMode,
			panels,
			updateAllowed,
			panelsWithData,
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
						id: uuid(),
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
				...stagedPanels.value.map((panel) => {
					return panel;
				}),
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

		function stitchQueriesToGql(queries: Record<string, any>) {
			if (!queries) return {};

			const formattedQuery = {
				query: {},
			};

			for (const [key, query] of Object.entries(queries)) {
				if (!query?.collection || !query.query) continue;

				const sanitizedKey = 'id_' + key.replaceAll('-', '_');

				formattedQuery.query[sanitizedKey] = {};
				formattedQuery.query[sanitizedKey].__aliasFor = query.collection;

				if (!isEmpty(query.query.aggregate)) {
					formattedQuery.query[sanitizedKey].__aliasFor = query.collection + '_aggregated';

					for (const [aggregateFunc, field] of Object.entries(query.query.aggregate)) {
						if (!formattedQuery.query[sanitizedKey][aggregateFunc]) {
							formattedQuery.query[sanitizedKey][aggregateFunc] = {};
						}

						formattedQuery.query[sanitizedKey][aggregateFunc][field] = true;
					}

					if (query.query.groupBy) {
						formattedQuery.query[sanitizedKey].__args = { groupBy: query.query.groupBy };
						formattedQuery.query[sanitizedKey].group = true;
					}
				}

				if (query.query.fields) {
					for (const field of query.query.fields) {
						formattedQuery.query[sanitizedKey][field] = true;
					}
				}

				if (query.query.filter) {
					if (!formattedQuery.query[sanitizedKey].__args) {
						formattedQuery.query[sanitizedKey].__args = {};
					}
					formattedQuery.query[sanitizedKey].__args.filter = query.query.filter;
				}
			}
			return jsonToGraphQLQuery(formattedQuery);
		}

		async function caller(query) {
			if (query === 'query') return;

			const newResponse: Record<string, Panel> = {};

			try {
				const res = await api.post('/graphql', {
					query: query,
				});
				for (const panel of panels.value) {
					const panelId = 'id_' + panel.id.replaceAll('-', '_');
					if (response.value[panelId]) newResponse[panelId] = response.value[panelId];
					if (res.data.data[panelId]) newResponse[panelId] = res.data.data[panelId];

					if (newResponse[panelId]) {
						panel.data = newResponse[panelId];
					}
					panelsWithData.value.push(panel);
				}
				response.value = newResponse;
			} catch (errs) {
				const queriesToRemove: Record<string, any> = {};

				for (const error of errs.response.data.errors) {
					const message = error.extensions.graphqlErrors[0].message;

					if (message && message.includes('_aggregated')) {
						const field = message.match(/"(.*?)"/)[1];
						const collection = message.match(/"([^ ]*?)_aggregated/)[1];
						queriesToRemove[collection] = { field, aggregate: true };
					} else if (message && message.includes('_filter')) {
						const field = message.match(/"([^ ]*?)"/)[1];
						const collection = message.match(/"([^ ]*?)_filter/)[1];

						queriesToRemove[collection] = { field, filter: true };
					} else if (message) {
						const fields = message.match(/"([^ ]*?)"/g)[0];

						queriesToRemove[fields[1]] = { field: fields[0] };
					}
				}

				for (const [key, query] of Object.entries(queryObject.value)) {
					const match = queriesToRemove[query?.collection];

					if (
						match?.aggregate &&
						query.query.aggregate &&
						JSON.stringify(query.query.aggregate).includes(match.field)
					) {
						delete queryObject.value[key];
					} else if (match?.filter && query.query.filter && JSON.stringify(query.query.filter).includes(match.field)) {
						delete queryObject.value[key];
					} else if (match && query.query.fields.includes(match.field)) {
						delete queryObject.value[key];
					}
				}

				const newQuery = stitchQueriesToGql(queryObject.value);
				caller(newQuery);
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
