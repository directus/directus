<script setup lang="ts">
import AiLoadingIndicator from './ai-loading-indicator.vue';
import AiMessage from './ai-message.vue';
import { useAiStore } from '../stores/use-ai';
import type { UIMessage } from 'ai';
import { onMounted, ref } from 'vue';

export type AiMessage = UIMessage;

export type AiStatus = 'ready' | 'streaming' | 'submitted' | 'error';

const aiStore = useAiStore();

const el = ref<HTMLElement | null>(null);

onMounted(() => {
	// Scroll 1 pixel down to trigger the scroll anchor
	el.value?.scroll(0, 1);
});
</script>

<template>
	<div ref="el" :data-status="aiStore.status" class="ai-message-list">
		<AiMessage v-for="message in aiStore.messages" :key="message.id" v-bind="message" />

		<AiMessage v-if="aiStore.status === 'submitted'" id="indicator" role="assistant" :parts="[]">
			<AiLoadingIndicator />
		</AiMessage>
	</div>
</template>

<style scoped>
.ai-message-list {
	display: flex;
	flex-direction: column;
	gap: 1.5rem;
	padding-block-end: 1rem;
	position: relative;
}
</style>
