<template>
	<insights-not-found v-if="!currentDashboard" />
	<private-view v-else :title="currentDashboard.name">
		<template #title-outer:prepend>
			<v-button rounded disabled icon secondary>
				<v-icon :name="currentDashboard.icon" />
			</v-button>
		</template>

		<template #headline>
			<v-breadcrumb :items="[{ name: $t('insights'), to: '/insights' }]" />
		</template>

		<template #actions>
			<template v-if="editMode">
				<v-button rounded icon outlined :to="`/insights/${currentDashboard.id}/+`">
					<v-icon name="add" />
				</v-button>

				<v-button rounded icon @click="saveChanges" :loading="saving">
					<v-icon name="check" />
				</v-button>
			</template>

			<template v-else>
				<v-button rounded icon @click="editMode = !editMode">
					<v-icon name="edit" />
				</v-button>
			</template>
		</template>

		<template #navigation>
			<insights-navigation />
		</template>

		<div class="workspace" :class="{ editing: editMode }" :style="workspaceSize">
			<insights-panel
				v-for="panel in panels"
				:key="panel.id"
				:panel="panel"
				:edit-mode="editMode"
				@update="stagePanelEdits($event, panel.id)"
			/>
		</div>

		<router-view
			name="detail"
			:dashboard-key="primaryKey"
			:panel="panels.find((panel) => panel.id === panelKey)"
			@save="stageConfiguration"
			@cancel="$router.push(`/insights/${primaryKey}`)"
		/>
	</private-view>
</template>

<script lang="ts">
import InsightsNavigation from '../components/navigation.vue';
import { defineComponent, computed, ref } from '@vue/composition-api';
import { useInsightsStore } from '@/stores';
import InsightsNotFound from './not-found.vue';
import { Panel } from '@/types';
import { nanoid } from 'nanoid';
import { merge } from 'lodash';
import router from '@/router';
import { omit } from 'lodash';
import { unexpectedError } from '@/utils/unexpected-error';
import api from '@/api';
import InsightsPanel from '../components/panel.vue';

export default defineComponent({
	name: 'InsightsDashboard',
	components: { InsightsNotFound, InsightsNavigation, InsightsPanel },
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
		const editMode = ref(false);
		const saving = ref(false);
		const insightsStore = useInsightsStore();

		const currentDashboard = computed(() =>
			insightsStore.state.dashboards.find((dashboard) => dashboard.id === props.primaryKey)
		);

		const stagedPanels = ref<Partial<Panel>[]>([]);

		const panels = computed(() => {
			const savedPanels = currentDashboard.value?.panels || [];

			return [
				...savedPanels.map((panel) => {
					const updates = stagedPanels.value.find((updatedPanel) => updatedPanel.id === panel.id);

					if (updates) {
						return merge({}, panel, updates);
					}

					return panel;
				}),
				...stagedPanels.value.filter((panel) => panel.id?.startsWith('_')),
			];
		});

		const workspaceSize = computed(() => {
			const furthestPanelX = panels.value.reduce(
				(aggr, panel) => {
					if (panel.position_x! > aggr.position_x!) {
						aggr.position_x = panel.position_x;
						aggr.width = panel.width;
					}

					return aggr;
				},
				{ position_x: 0, width: 0 }
			);

			const furthestPanelY = panels.value.reduce(
				(aggr, panel) => {
					if (panel.position_y! > aggr.position_y!) {
						aggr.position_y = panel.position_y;
						aggr.height = panel.height;
					}

					return aggr;
				},
				{ position_y: 0, height: 0 }
			);

			if (editMode.value === true) {
				return {
					width: (furthestPanelX.position_x! + furthestPanelX.width! + 25) * 20 + 'px',
					height: (furthestPanelY.position_y! + furthestPanelY.height! + 25) * 20 + 'px',
				};
			}

			return {
				width: (furthestPanelX.position_x! + furthestPanelX.width! - 1) * 20 + 'px',
				height: (furthestPanelY.position_y! + furthestPanelY.height! - 1) * 20 + 'px',
			};
		});

		return {
			currentDashboard,
			editMode,
			panels,
			stagePanelEdits,
			stagedPanels,
			saving,
			saveChanges,
			stageConfiguration,
			workspaceSize,
		};

		function stagePanelEdits(edits: Partial<Panel>, key: string = props.panelKey) {
			if (key === '+') {
				stagedPanels.value = [
					...stagedPanels.value,
					{
						id: `_${nanoid()}`,
						...edits,
					},
				];
			} else {
				if (stagedPanels.value.some((panel) => panel.id === key)) {
					stagedPanels.value = stagedPanels.value.map((panel) => {
						if (panel.id === key) {
							return merge({ id: key }, panel, edits);
						}

						return panel;
					});
				} else {
					stagedPanels.value = [...stagedPanels.value, { id: key, ...edits }];
				}
			}
		}

		function stageConfiguration(edits: Partial<Panel>) {
			stagePanelEdits(edits);
			router.push(`/insights/${props.primaryKey}`);
		}

		async function saveChanges() {
			if (!currentDashboard.value) return;

			saving.value = true;

			const currentIDs = currentDashboard.value.panels.map((panel) => panel.id);

			const updatedPanels = [
				...currentIDs.map((id) => {
					return stagedPanels.value.find((panel) => panel.id === id) || id;
				}),
				...stagedPanels.value.filter((panel) => panel.id?.startsWith('_')).map((panel) => omit(panel, 'id')),
			];

			try {
				await api.patch(`/dashboards/${props.primaryKey}`, {
					panels: updatedPanels,
				});

				await insightsStore.hydrate();

				stagedPanels.value = [];
				editMode.value = false;
			} catch (err) {
				unexpectedError(err);
			} finally {
				saving.value = false;
			}
		}
	},
});
</script>

<style scoped>
.workspace {
	position: relative;
	display: grid;
	grid-template-rows: repeat(auto-fill, 20px);
	grid-template-columns: repeat(auto-fill, 20px);
	min-width: calc(100% - var(--content-padding) - var(--content-padding));
	min-height: calc(100% - 120px);
	margin-right: var(--content-padding);
	margin-left: var(--content-padding);
	overflow: visible;
}

.workspace > * {
	z-index: 2;
}

.workspace::before {
	position: absolute;
	top: -4px;
	left: -4px;
	display: block;
	width: calc(100% + 8px);
	height: calc(100% + 8px);
	background-image: radial-gradient(#efefef 10%, transparent 10%);
	background-position: -6px -6px;
	background-size: 20px 20px;
	opacity: 0;
	transition: opacity var(--slow) var(--transition);
	content: '';
	pointer-events: none;
}

.workspace.editing::before {
	opacity: 1;
}
</style>
