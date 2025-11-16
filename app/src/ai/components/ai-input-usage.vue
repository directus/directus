<script setup lang="ts">
import VProgressCircular from '@/components/v-progress-circular.vue';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAiStore } from '../stores/use-ai';
import { abbreviateNumber } from '@directus/utils';

const { t, n } = useI18n();

const aiStore = useAiStore();

const shown = computed(() => {
	return aiStore.contextUsagePercentage > 20;
});

const tooltip = computed(() => {
	const model = aiStore.selectedModel;
	if (!model) return null;
	return t('ai.context_used', {
		totalTokens: abbreviateNumber(aiStore.tokenUsage.totalTokens),
		contextLimit: abbreviateNumber(model.limit.context),
		contextUsagePercentage: n(aiStore.contextUsagePercentage / 100, 'percent'),
	});
});
</script>

<template>
	<VProgressCircular v-show="shown" v-tooltip.left="tooltip" :value="aiStore.contextUsagePercentage" small />
</template>
