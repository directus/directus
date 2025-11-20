<script lang="ts" setup>
import VIcon from '@/components/v-icon/v-icon.vue';
import { useAiStore } from '../stores/use-ai';
import AiModelSelector from './ai-model-selector.vue';

const aiStore = useAiStore();
</script>

<template>
	<div class="ai-header">
		<ai-model-selector />
		<div class="spacer" />
		<v-icon v-tooltip.left="$t('ai.clear_conversation')" clickable name="delete_history" small @click="aiStore.reset" />
	</div>
</template>

<style scoped>
.ai-header {
	display: flex;
	align-items: center;
	padding-block-end: 12px;
	padding-inline-end: 12px;
}

.spacer {
	flex-grow: 1;
}
</style>
