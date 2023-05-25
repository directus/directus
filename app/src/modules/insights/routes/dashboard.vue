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
					@click="cancelChanges"
				>
					<v-icon name="clear" />
				</v-button>

				<v-button v-tooltip.bottom="t('create_panel')" rounded icon outlined :to="`/insights/${currentDashboard.id}/+`">
					<v-icon name="add" />
				</v-button>

				<v-button
					v-tooltip.bottom="t('save')"
					:disabled="!hasEdits"
					rounded
					icon
					:loading="saving"
					@click="saveChanges"
				>
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
			<sidebar-detail icon="info" :title="t('information')" close>
				<div v-md="t('page_help_insights_dashboard')" class="page-description" />
			</sidebar-detail>

			<refresh-sidebar-detail v-model="refreshInterval" @refresh="insightsStore.refresh(primaryKey)" />
		</template>

		<template #navigation>
			<insights-navigation />
		</template>

		<v-workspace
			:edit-mode="editMode"
			:tiles="tiles"
			:zoom-to-fit="zoomToFit"
			@duplicate="(tile) => insightsStore.stagePanelDuplicate(tile.id)"
			@edit="(tile) => router.push(`/insights/${primaryKey}/${tile.id}`)"
			@update="insightsStore.stagePanelUpdate"
			@delete="insightsStore.stagePanelDelete"
			@move="copyPanelID = $event"
		>
			<template #default="{ tile }">
				<v-progress-circular
					v-if="loading.includes(tile.id) && !data[tile.id]"
					:class="{ 'header-offset': tile.showHeader }"
					class="panel-loading"
					indeterminate
				/>
				<div v-else class="panel-container" :class="{ loading: loading.includes(tile.id) }">
					<div v-if="errors[tile.id]" class="panel-error">
						<v-icon name="warning" />
						{{ t('unexpected_error') }}
						<v-error :error="errors[tile.id]" />
					</div>
					<div
						v-else-if="tile.id in data && isEmpty(data[tile.id])"
						class="panel-no-data type-note"
						:class="{ 'header-offset': tile.showHeader }"
					>
						{{ t('no_data') }}
					</div>
					<v-error-boundary v-else :name="`panel-${tile.data.type}`">
						<component
							:is="`panel-${tile.data.type}`"
							v-bind="tile.data.options"
							:id="tile.id"
							:dashboard="primaryKey"
							:show-header="tile.showHeader"
							:height="tile.height"
							:width="tile.width"
							:now="now"
							:data="data[tile.id]"
						/>

						<template #fallback="{ error }">
							<div class="panel-error">
								<v-icon name="warning" />
								{{ t('unexpected_error') }}
								<v-error :error="error" />
							</div>
						</template>
					</v-error-boundary>
				</div>
			</template>
		</v-workspace>

		<router-view name="detail" :dashboard-key="primaryKey" :panel-key="panelKey" />

		<v-dialog :model-value="!!copyPanelID" @update:model-value="copyPanelID = null" @esc="copyPanelID = null">
			<v-card>
				<v-card-title>{{ t('copy_to') }}</v-card-title>

				<v-card-text>
					<v-notice v-if="copyPanelChoices.length === 0">
						{{ t('no_other_dashboards_copy') }}
					</v-notice>
					<v-select v-else v-model="copyPanelTo" :items="copyPanelChoices" item-text="name" item-value="id" />
				</v-card-text>

				<v-card-actions>
					<v-button secondary @click="copyPanelID = null">
						{{ t('cancel') }}
					</v-button>
					<v-button @click="copyPanel">
						{{ t('copy') }}
					</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<v-dialog v-model="confirmCancel" @esc="confirmCancel = false">
			<v-card>
				<v-card-title>{{ t('unsaved_changes') }}</v-card-title>
				<v-card-text>{{ t('discard_changes_copy') }}</v-card-text>
				<v-card-actions>
					<v-button secondary @click="cancelChanges(true)">
						{{ t('discard_changes') }}
					</v-button>
					<v-button @click="confirmCancel = false">{{ t('keep_editing') }}</v-button>
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
	</private-view>
</template>

<script setup lang="ts">
import { AppTile } from '@/components/v-workspace-tile.vue';
import { useEditsGuard } from '@/composables/use-edits-guard';
import { useShortcut } from '@/composables/use-shortcut';
import { useExtensions } from '@/extensions';
import { router } from '@/router';
import { useAppStore } from '@/stores/app';
import { useInsightsStore } from '@/stores/insights';
import { usePermissionsStore } from '@/stores/permissions';
import { pointOnLine } from '@/utils/point-on-line';
import RefreshSidebarDetail from '@/views/private/components/refresh-sidebar-detail.vue';
import { applyOptionsData } from '@directus/utils';
import { assign, isEmpty } from 'lodash';
import { computed, ref, toRefs, unref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import InsightsNavigation from '../components/navigation.vue';
import InsightsNotFound from './not-found.vue';

interface Props {
	primaryKey: string;
	panelKey?: string | null;
}

const props = withDefaults(defineProps<Props>(), { panelKey: null });

const { t } = useI18n();

const { panels: panelsInfo } = useExtensions();

const insightsStore = useInsightsStore();
const appStore = useAppStore();
const permissionsStore = usePermissionsStore();

const { fullScreen } = toRefs(appStore);
const { loading, errors, data, saving, hasEdits, refreshIntervals, variables } = toRefs(insightsStore);

const zoomToFit = ref(false);

const updateAllowed = computed<boolean>(() => {
	return permissionsStore.hasPermission('directus_panels', 'update');
});

const now = new Date();

const editMode = ref(false);

const tiles = computed<AppTile[]>(() => {
	const panels = insightsStore.getPanelsForDashboard(props.primaryKey);

	const panelsWithCoordinates = panels.map((panel) => ({
		...panel,
		coordinates: [
			[panel.position_x!, panel.position_y!],
			[panel.position_x! + panel.width!, panel.position_y!],
			[panel.position_x! + panel.width!, panel.position_y! + panel.height!],
			[panel.position_x!, panel.position_y! + panel.height!],
		] as [number, number][],
	}));

	const tiles: AppTile[] = panelsWithCoordinates
		.map((panel) => {
			let topLeftIntersects = false;
			let topRightIntersects = false;
			let bottomRightIntersects = false;
			let bottomLeftIntersects = false;

			for (const otherPanel of panelsWithCoordinates) {
				if (otherPanel.id === panel.id) continue;

				const borders = [
					[otherPanel.coordinates[0], otherPanel.coordinates[1]],
					[otherPanel.coordinates[1], otherPanel.coordinates[2]],
					[otherPanel.coordinates[2], otherPanel.coordinates[3]],
					[otherPanel.coordinates[3], otherPanel.coordinates[0]],
				];

				if (topLeftIntersects === false) {
					topLeftIntersects = borders.some(([p1, p2]) => pointOnLine(panel.coordinates[0], p1, p2));
				}

				if (topRightIntersects === false) {
					topRightIntersects = borders.some(([p1, p2]) => pointOnLine(panel.coordinates[1], p1, p2));
				}

				if (bottomRightIntersects === false) {
					bottomRightIntersects = borders.some(([p1, p2]) => pointOnLine(panel.coordinates[2], p1, p2));
				}

				if (bottomLeftIntersects === false) {
					bottomLeftIntersects = borders.some(([p1, p2]) => pointOnLine(panel.coordinates[3], p1, p2));
				}
			}

			const panelType = unref(panelsInfo).find((panelType) => panelType.id === panel.type);

			const tile: AppTile = {
				id: panel.id,
				x: panel.position_x,
				y: panel.position_y,
				width: panel.width,
				height: panel.height,
				name: panel.name,
				icon: panel.icon ?? panelType?.icon,
				color: panel.color,
				note: panel.note,
				showHeader: panel.show_header === true,
				minWidth: panelType?.minWidth,
				minHeight: panelType?.minHeight,
				draggable: true,
				borderRadius: [!topLeftIntersects, !topRightIntersects, !bottomRightIntersects, !bottomLeftIntersects],
				data: {
					options: applyOptionsData(panel.options ?? {}, unref(variables), panelType?.skipUndefinedKeys),
					type: panel.type,
				},
			};

			return tile;
		})
		.filter((t) => t);

	return tiles;
});

watch(
	() => props.primaryKey,
	() => {
		insightsStore.refresh(props.primaryKey);
	}
);

const confirmCancel = ref(false);

const cancelChanges = (force = false) => {
	if (unref(hasEdits) && force !== true) {
		confirmCancel.value = true;
	} else {
		insightsStore.clearEdits();
		editMode.value = false;
		confirmCancel.value = false;
		insightsStore.refresh(props.primaryKey);
	}
};

const copyPanelTo = ref(insightsStore.dashboards.find((dashboard) => dashboard.id !== props.primaryKey)?.id);
const copyPanelID = ref<string | null>();

const copyPanel = () => {
	insightsStore.stagePanelDuplicate(unref(copyPanelID)!, { dashboard: unref(copyPanelTo) });
	copyPanelID.value = null;
};

useShortcut('meta+s', () => {
	saveChanges();
});

async function saveChanges() {
	await insightsStore.saveChanges();
	editMode.value = false;
}

watch(editMode, (editModeEnabled) => {
	if (editModeEnabled) {
		zoomToFit.value = false;
	}
});

const currentDashboard = computed(() => insightsStore.getDashboard(props.primaryKey));

const copyPanelChoices = computed(() => {
	return insightsStore.dashboards.filter((dashboard) => dashboard.id !== props.primaryKey);
});

const { confirmLeave, leaveTo } = useEditsGuard(hasEdits, {
	ignorePrefix: computed(() => `/insights/${props.primaryKey}`),
});

const discardAndLeave = () => {
	if (!unref(leaveTo)) return;
	cancelChanges(true);
	confirmLeave.value = false;
	router.push(unref(leaveTo)!);
};

const toggleFullScreen = () => (fullScreen.value = !fullScreen.value);
const toggleZoomToFit = () => (zoomToFit.value = !zoomToFit.value);

const refreshInterval = computed({
	get() {
		return unref(refreshIntervals)[props.primaryKey] ?? null;
	},
	set(val) {
		refreshIntervals.value = assign({}, unref(refreshIntervals), { [props.primaryKey]: val });
	},
});
</script>

<style scoped lang="scss">
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

.panel-container {
	width: 100%;
	height: 100%;
	opacity: 1;
	transition: opacity var(--fast) var(--transition);

	&.loading {
		opacity: 0.5;
	}
}

.panel-loading {
	position: absolute;
	left: 50%;
	top: 50%;
	transform: translate(-50%, -50%);

	&.header-offset {
		top: calc(50% - 12px);
	}
}

.panel-error {
	padding: 20px;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-direction: column;
	width: 100%;
	height: 100%;

	--v-icon-color: var(--danger);

	.v-error {
		margin-top: 8px;
		max-width: 100%;
	}
}

.panel-no-data {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: 100%;

	&.header-offset {
		height: calc(100% - 24px);
	}
}
</style>
