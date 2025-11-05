<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue';
import { onBeforeUnmount, onMounted, ref } from 'vue';
import AiMessage from './ai-message.vue';

import type { UIMessage } from 'ai';

export type AiMessage = UIMessage;

export type AiStatus = 'ready' | 'streaming' | 'submitted' | 'error';

interface Props {
	/** Array of messages to display */
	messages?: UIMessage[];
	/** Current status of the AI interaction */
	status?: AiStatus;
}

defineProps<Props>();

const el = ref<HTMLElement | null>(null);
// const messagesRefs = ref(new Map<string, HTMLElement>());

// function registerMessageRef(id: string, element: ComponentPublicInstance | null) {
// 	const elInstance = element?.$el;

// 	if (elInstance) {
// 		messagesRefs.value.set(id, elInstance);
// 	}
// }

onMounted(() => {
	// Scroll 1 pixel down to trigger the scroll anchor
	el.value?.scroll(0,1)
});
</script>

<template>
	<div ref="el" :data-status="status" class="ai-message-list">
		<slot>
			<AiMessage
				v-for="message in messages"
				:key="message.id"
				v-bind="message"
				/>
				<!-- :ref="(el) => registerMessageRef(message.id, el as ComponentPublicInstance)" -->
		</slot>

		<AiMessage v-if="status === 'submitted'" id="indicator" role="assistant" :parts="[]">
			<template #content>
				<slot name="indicator">
					<div class="loading-indicator">
						<span />
						<span />
						<span />
					</div>
				</slot>
			</template>
		</AiMessage>

		<div id="anchor"></div>
	</div>
</template>

<style scoped>
/*
  Available Variables:
  --ai-message-list-gap          [1rem]
*/

.ai-message-list {
	display: flex;
	flex-direction: column;
	gap: var(--ai-message-list-gap, 1rem);
	padding-block-end: 1rem;
	position: relative;
}

.ai-message-list * {
	overflow-anchor: none;
}

#anchor {
	overflow-anchor: auto;
	block-size: 1px;
}

.loading-indicator {
	display: flex;
	gap: 0.375rem;
	padding: 1rem;
	align-items: center;

	span {
		inline-size: 0.5rem;
		block-size: 0.5rem;
		background-color: var(--theme--foreground-subdued);
		border-radius: 50%;
		animation: loading-bounce var(--slow) infinite var(--transition) both;

		&:nth-child(1) {
			animation-delay: -0.32s;
		}

		&:nth-child(2) {
			animation-delay: -0.16s;
		}
	}
}

@keyframes loading-bounce {
	0%,
	80%,
	100% {
		transform: scale(0.8);
		opacity: 0.5;
	}
	40% {
		transform: scale(1);
		opacity: 1;
	}
}

.auto-scroll-container {
	position: sticky;
	inset-block-end: 0;
	display: flex;
	justify-content: center;
	align-items: center;
	padding-block-start: 1rem;
	pointer-events: none;
}

.auto-scroll-button {
	pointer-events: all;
	box-shadow: var(--theme--shadow);
	padding: 4px;

	--v-button-background-color: var(--theme--background);
	--v-button-background-color-hover: var(--theme--background-accent);
	--v-button-color: var(--theme--foreground);
	--v-button-color-hover: var(--theme--foreground-accent);
}

.auto-scroll-enter-active,
.auto-scroll-leave-active {
	transition:
		opacity var(--fast) var(--transition),
		transform var(--fast) var(--transition);
}

.auto-scroll-enter-from,
.auto-scroll-leave-to {
	opacity: 0;
	transform: translateY(0.5rem);
}
</style>
