<template>
	<private-view title="Insights">
		<template #navigation>
			<insights-navigation />
		</template>
		<div>Dashboard</div>
	</private-view>
</template>

<script>
import InsightsNavigation from '../components/navigation.vue';
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
	name: 'InsightsDashboard',
	components: { InsightsNavigation },
});
</script>
