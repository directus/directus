<template>
	<v-list large>
		<v-list-item v-for="navItem in navItems" :key="navItem.to" :to="navItem.to">
			<v-list-item-icon><v-icon :name="navItem.icon" /></v-list-item-icon>
			<v-list-item-content>
				<v-text-overflow :text="navItem.name" />
			</v-list-item-content>
		</v-list-item>
	</v-list>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from '@vue/composition-api';
import { useInsightsStore } from '@/stores';
import { Dashboard } from '@/types';

export default defineComponent({
	name: 'InsightsNavigation',
	setup() {
		const insightsStore = useInsightsStore();

		const createDialogActive = ref(false);

		const navItems = computed(() =>
			insightsStore.state.dashboards.map((dashboard: Dashboard) => ({
				icon: dashboard.icon,
				name: dashboard.name,
				to: `/insights/${dashboard.id}`,
			}))
		);

		return { navItems, createDialogActive };
	},
});
</script>
