<script setup lang="ts">
import { useSidebarStore } from '@/views/private/private-view/stores/sidebar';
import AiConversation from './ai-conversation.vue';
import AiHeader from './ai-header.vue';

const sidebarStore = useSidebarStore();
</script>

<template>
	<sidebar-detail id="ai" :title="$t('ai_chat')" icon="smart_toy" class="ai-sidebar">
		<ai-header />
		<div class="ai-sidebar-content">
			<ai-conversation v-if="!sidebarStore.collapsed" />
		</div>
	</sidebar-detail>
</template>

<style scoped>
.ai-sidebar-content {
	display: flex;
	flex-direction: column;
	flex: 1;
	min-block-size: 0;
}
</style>
