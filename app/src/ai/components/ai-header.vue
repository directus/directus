<script lang="ts" setup>
import AiModelSelector from './ai-model-selector.vue';
import AiSettingsMenu from './ai-settings-menu.vue';
import { useAiStore } from '../stores/use-ai';
import VButton from '@/components/v-button.vue';
import VIcon from '@/components/v-icon/v-icon.vue';

const aiStore = useAiStore();
</script>

<template>
	<div class="ai-header">
		<AiModelSelector />
		<div class="spacer" />
		<VButton v-tooltip.left="$t('ai.clear_conversation')" x-small icon secondary @click="aiStore.reset">
			<VIcon clickable name="delete_history" small />
		</VButton>
		<AiSettingsMenu class="settings-menu" />
	</div>
</template>

<style scoped>
.ai-header {
	display: flex;
	align-items: center;
	padding-block-end: 6px;
}

.spacer {
	flex-grow: 1;
}

.settings-menu {
	margin-inline-start: 4px;
}
</style>
