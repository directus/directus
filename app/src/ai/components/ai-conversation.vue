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
				:user-config="{ variant: 'primary', side: 'right', avatar: { icon: 'person' } }"
				:assistant-config="{ variant: 'subdued', side: 'left', avatar: { icon: 'smart_toy' } }"
				should-auto-scroll
				should-scroll-to-bottom
			/>
		</div>

		<div class="input-container">
			<v-progress-linear v-if="aiStore.status === 'streaming' || aiStore.status === 'submitted'" indeterminate />
			<ai-input @send="aiStore.addMessage" />
		</div>
	</div>
</template>

<style lang="scss" scoped>
.messages-container {
	flex: 1;
	overflow-y: auto;
	display: flex;
	flex-direction: column;
	padding-bottom: 0;
	min-height: 0;
}

.input-container {
	flex-shrink: 0;
	padding-top: 0;
}

.v-progress-linear {
	margin-bottom: var(--content-padding);
}
</style>
