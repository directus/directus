<script setup lang="ts">
import { useAiStore } from '../stores/use-ai';
import AiMessageList from './ai-message-list.vue';
import AiInput from './ai-input.vue';

const aiStore = useAiStore();
</script>

<template>
	<div class="ai-conversation">
		<div class="messages-container">
			<ai-message-list
				:messages="aiStore.messages"
				:status="aiStore.status"
				should-auto-scroll
				should-scroll-to-bottom
			/>
		</div>

		<div class="input-container">
			<ai-input @send="aiStore.addMessage" />
		</div>
	</div>
</template>

<style scoped>
.ai-conversation {
	display: flex;
	flex-direction: column;
	flex: 1;
	min-height: 0;
}

.messages-container {
	position: relative;
	flex: 1;
	overflow-y: auto;
	min-height: 0;
}

.input-container {
	flex-shrink: 0;
}
</style>
