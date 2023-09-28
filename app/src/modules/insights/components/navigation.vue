<script setup lang="ts">
import { useInsightsStore } from '@/stores/insights';
import { Dashboard } from '@/types/insights';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

defineEmits(['create']);

const { t } = useI18n();
const insightsStore = useInsightsStore();

const navItems = computed(() =>
	insightsStore.dashboards.map((dashboard: Dashboard) => ({
		icon: dashboard.icon,
		color: dashboard.color,
		name: dashboard.name,
		to: `/insights/${dashboard.id}`,
	}))
);
</script>

<template>
	<v-list nav>
		<v-button v-if="navItems.length === 0" full-width outlined dashed @click="$emit('create')">
			{{ t('create_dashboard') }}
		</v-button>

		<v-list-item v-for="navItem in navItems" v-else :key="navItem.to" :to="navItem.to">
			<v-list-item-icon><v-icon :name="navItem.icon" :color="navItem.color" /></v-list-item-icon>
			<v-list-item-content>
				<v-text-overflow :text="navItem.name" />
			</v-list-item-content>
		</v-list-item>
	</v-list>
</template>
