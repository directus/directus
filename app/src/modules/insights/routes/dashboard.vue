<template>
	<insights-not-found v-if="!currentDashboard" />
	<private-view v-else :title="currentDashboard.name">
		<template #title-outer:prepend>
			<v-button rounded disabled icon secondary>
				<v-icon :name="currentDashboard.icon" />
			</v-button>
		</template>

		<template #actions>
			<v-button v-if="editMode" rounded icon outlined :to="`/insights/${currentDashboard.id}/panel/+`">
				<v-icon name="add" />
			</v-button>

			<v-button rounded icon @click="editMode = !editMode">
				<v-icon :name="editMode ? 'check' : 'edit'" />
			</v-button>
		</template>

		<template #navigation>
			<insights-navigation />
		</template>

		<div class="workspace" :class="{ editing: editMode }">
			<!-- <div class="dummy" /> -->
		</div>

		<router-view name="detail" :dashboard-key="primaryKey" />
	</private-view>
</template>

<script>
import InsightsNavigation from '../components/navigation.vue';
import { defineComponent, computed, ref } from '@vue/composition-api';
import { useInsightsStore } from '@/stores';
import InsightsNotFound from './not-found.vue';

export default defineComponent({
	name: 'InsightsDashboard',
	components: { InsightsNotFound, InsightsNavigation },
	props: {
		primaryKey: {
			type: String,
			required: true,
		},
	},
	setup(props) {
		const editMode = ref(false);
		const insightsStore = useInsightsStore();

		const currentDashboard = computed(() =>
			insightsStore.state.dashboards.find((dashboard) => dashboard.id === props.primaryKey)
		);

		const stagedPanels = ref([]);

		const panels = computed(() => {
			return currentDashboard.value?.panels || [];
		});

		return { currentDashboard, editMode, panels };
	},
});
</script>

<style scoped>
.workspace {
	position: relative;
	display: grid;
	grid-template-rows: repeat(auto-fill, 20px);
	grid-template-columns: repeat(auto-fill, 20px);
	min-width: 200%; /* will be replaced by JS */
	min-height: 200%; /* will be replaced by JS */
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
	background-image: radial-gradient(#efefef 20%, transparent 20%);
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

/* .dummy {
	--pos-x: 5;
	--pos-y: 5;
	--width: 5;
	--height: 5;

	display: block;
	grid-row: var(--pos-y) / span var(--height);
	grid-column: var(--pos-x) / span var(--width);
	background-color: var(--primary);
	border-radius: var(--border-radius);
} */
</style>
