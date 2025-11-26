<script lang="ts" setup>
import VIcon from '@/components/v-icon/v-icon.vue';
import { useAiStore } from '../stores/use-ai';
import AiModelSelector from './ai-model-selector.vue';
import AiSettingsMenu from './ai-settings-menu.vue';

const aiStore = useAiStore();
</script>

<template>
	<div class="ai-header">
		<ai-model-selector />
		<div class="spacer" />
		<v-button v-tooltip.left="$t('ai.clear_conversation')" x-small icon secondary @click="aiStore.reset">
			<v-icon clickable name="delete_history" small />
		</v-button>
		<ai-settings-menu class="settings-menu" />
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

.settings-menu {
	margin-inline-start: 4px;
}
</style>
