<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useAiStore } from '../stores/use-ai';
import AiMessage from './ai-message.vue';

import type { UIMessage } from 'ai';

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
			<div class="loading-indicator">
				<span />
				<span />
				<span />
			</div>
		</AiMessage>
	</div>
</template>

<style scoped>
/*
  Available Variables:
  --ai-message-list-gap          [2.5rem]
*/

.ai-message-list {
	display: flex;
	flex-direction: column;
	gap: var(--ai-message-list-gap, 2.5rem);
	padding-block-end: 1rem;
	position: relative;
}

.loading-indicator {
	display: flex;
	gap: 0.375rem;
	padding-inline: 3px;
	align-items: center;
	margin-block-start: 1rem;

	span {
		--delay: 0;
		--duration: 800ms;

		inline-size: 0.5rem;
		block-size: 0.5rem;
		background-color: var(--theme--foreground);
		border-radius: 50%;
		animation: loading-bounce;
		animation-timing-function: var(--transition);
		animation-iteration-count: infinite;
		animation-fill-mode: both;
		animation-duration: 800ms;
		animation-delay: var(--delay);

		&:nth-child(1) {
			--delay: var(--slow);
		}

		&:nth-child(2) {
			--delay: calc(var(--slow) + 200ms);
		}

		&:nth-child(3) {
			--delay: calc(var(--slow) + 400ms);
		}
	}
}

@keyframes loading-bounce {
	0%,
	80%,
	100% {
		opacity: 0.5;
	}
	40% {
		transform: scale(1);
		opacity: 1;
	}
}
</style>
