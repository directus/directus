<template>
	<insights-not-found v-if="!currentDashboard" />
	<private-view v-else :title="currentDashboard.name">
		<template #title-outer:prepend>
			<v-button rounded disabled icon secondary>
				<v-icon :name="currentDashboard.icon" />
			</v-button>
		</template>

		<template #navigation>
			<insights-navigation />
		</template>
	</private-view>
</template>

<script>
import InsightsNavigation from '../components/navigation.vue';
import { defineComponent, computed } from '@vue/composition-api';
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
		const insightsStore = useInsightsStore();

		const currentDashboard = computed(() =>
			insightsStore.state.dashboards.find((dashboard) => dashboard.id === props.primaryKey)
		);

		return { currentDashboard };
	},
});
</script>
