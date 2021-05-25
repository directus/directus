<template>
	<insights-not-found v-if="!currentDashboard" />
	<private-view v-else :title="currentDashboard.name">
		<template #title-outer:prepend>
			<v-button rounded disabled icon secondary>
				<v-icon :name="currentDashboard.icon" />
			</v-button>
		</template>

		<template #actions>
			<v-button rounded icon @click="editMode = !editMode">
				<v-icon :name="editMode ? 'check' : 'edit'" />
			</v-button>
		</template>

		<template #navigation>
			<insights-navigation />
		</template>

		<div class="workspace" :class="{ editing: editMode }"></div>
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

		return { currentDashboard, editMode };
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

.workspace::before {
	position: absolute;
	top: -4px;
	left: -4px;
	display: block;
	width: calc(100% + 8px);
	height: calc(100% + 8px);
	background-image: radial-gradient(#efefef 25%, transparent 25%);
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
