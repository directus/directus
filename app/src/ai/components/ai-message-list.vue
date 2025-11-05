<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue';
import { ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { useElementBounding } from '@vueuse/core';
import AiMessage from './ai-message.vue';

import type { UIMessage } from 'ai';

export type AiMessage = UIMessage;

export type AiStatus = 'ready' | 'streaming' | 'submitted' | 'error';

interface Props {
	/** Array of messages to display */
	messages?: UIMessage[];
	/** Current status of the AI interaction */
	status?: AiStatus;
	/** Auto-scroll to bottom when streaming */
	shouldAutoScroll?: boolean;
	/** Scroll to bottom on mount */
	shouldScrollToBottom?: boolean;
	/** Show auto-scroll button */
	autoScroll?: boolean;
	/** Icon for auto-scroll button */
	autoScrollIcon?: string;
	/** Compact mode for dense layouts */
	compact?: boolean;
	/** Spacing offset for last message in px */
	spacingOffset?: number;
}

const props = withDefaults(defineProps<Props>(), {
	shouldAutoScroll: false,
	shouldScrollToBottom: true,
	autoScroll: true,
	autoScrollIcon: 'arrow_downward',
	compact: false,
	spacingOffset: 0,
});

const el = ref<HTMLElement | null>(null);
const parent = ref<HTMLElement | null>(null);
const messagesRefs = ref(new Map<string, HTMLElement>());

const showAutoScroll = ref(false);
const lastScrollTop = ref(0);
const userScrolledUp = ref(false);
const lastMessageHeight = ref(0);
const lastMessageSubmitted = ref(false);

function registerMessageRef(id: string, element: ComponentPublicInstance | null) {
	const elInstance = element?.$el;

	if (elInstance) {
		messagesRefs.value.set(id, elInstance);
	}
}

function scrollToMessage(id: string) {
	const element = messagesRefs.value.get(id);

	if (element) {
		element.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}
}

function scrollToBottom(smooth: boolean = true) {
	if (!parent.value) return;

	if (smooth) {
		parent.value.scrollTo({ top: parent.value.scrollHeight, behavior: 'smooth' });
	} else {
		parent.value.scrollTop = parent.value.scrollHeight;
	}
}

// Throttle helper function
function throttle<T extends (...args: any[]) => void>(func: T, delay: number): T {
	let lastCall = 0;
	return ((...args: Parameters<T>) => {
		const now = Date.now();

		if (now - lastCall >= delay) {
			lastCall = now;
			func(...args);
		}
	}) as T;
}

// Watch messages and status for streaming auto-scroll
let throttledScrollCheck: (() => void) | null = null;
let resizeHandler: (() => void) | null = null;

watch(
	[() => props.messages, () => props.status],
	([_, status]) => {
		if (status !== 'streaming') return;

		if (!props.shouldAutoScroll) {
			checkScrollPosition();
			return;
		}

		// Scroll to bottom when message is streaming if shouldAutoScroll is true
		nextTick(() => {
			if (!parent.value || userScrolledUp.value) return;

			const scrollThreshold = 150;

			const distanceFromBottom =
				parent.value.scrollHeight - parent.value.scrollTop - parent.value.clientHeight;

			if (distanceFromBottom < scrollThreshold) {
				scrollToBottom(false);
			}
		});
	},
	{ deep: true },
);

watch(
	() => props.status,
	(status) => {
		if (status !== 'submitted') return;

		const lastMessage = props.messages?.[props.messages.length - 1];
		if (!lastMessage || lastMessage.role !== 'user') return;

		userScrolledUp.value = false;

		nextTick(() => {
			lastMessageSubmitted.value = true;

			updateLastMessageHeight();

			nextTick(() => {
				scrollToMessage(lastMessage.id);
			});
		});
	},
);

function updateLastMessageHeight() {
	if (!el.value || !parent.value || !props.messages?.length || !lastMessageSubmitted.value) {
		return;
	}

	const { height: parentHeight } = useElementBounding(parent.value);

	// Find last user message (findLast not available in current TS lib)
	const lastMessage = [...props.messages].reverse().find((m) => m.role === 'user');

	if (!lastMessage) {
		return;
	}

	const lastMessageEl = messagesRefs.value.get(lastMessage.id);

	if (!lastMessageEl) {
		return;
	}

	let spacingOffset = props.spacingOffset || 0;
	const elComputedStyle = window.getComputedStyle(el.value);
	const parentComputedStyle = window.getComputedStyle(parent.value);

	spacingOffset += Number.parseFloat(elComputedStyle.rowGap) || Number.parseFloat(elComputedStyle.gap) || 0;
	spacingOffset += Number.parseFloat(parentComputedStyle.paddingTop) || 0;
	spacingOffset += Number.parseFloat(parentComputedStyle.paddingBottom) || 0;

	lastMessageHeight.value = Math.max(parentHeight.value - lastMessageEl.offsetHeight - spacingOffset, 0);
}

function checkScrollPosition() {
	if (!parent.value) return;

	const scrollPosition = parent.value.scrollTop + parent.value.clientHeight;
	const scrollHeight = parent.value.scrollHeight;
	const threshold = 100;

	showAutoScroll.value = scrollHeight - scrollPosition >= threshold;

	// Detect user scrolling up
	if (parent.value.scrollTop < lastScrollTop.value) {
		userScrolledUp.value = true;
	} else if (scrollHeight - scrollPosition < threshold) {
		userScrolledUp.value = false;
	}

	lastScrollTop.value = parent.value.scrollTop;
}

function onAutoScrollClick() {
	userScrolledUp.value = false;
	scrollToBottom();
}

function getScrollParent(node: HTMLElement | null): HTMLElement | null {
	if (!node) return null;

	const overflowRegex = /auto|scroll/;
	let current: HTMLElement | null = node;

	while (current && current !== document.body && current !== document.documentElement) {
		const style = window.getComputedStyle(current);

		if (overflowRegex.test(style.overflowY)) {
			return current;
		}

		current = current.parentElement;
	}

	return document.documentElement;
}

onMounted(() => {
	// Find first scrollable parent element
	parent.value = getScrollParent(el.value);
	if (!parent.value) return;

	lastScrollTop.value = parent.value.scrollTop;

	// Create throttled scroll check
	throttledScrollCheck = throttle(checkScrollPosition, 50);

	// Wait for content to fully render
	setTimeout(() => {
		if (props.shouldScrollToBottom) {
			scrollToBottom(false);
		} else {
			checkScrollPosition();
		}
	}, 100);

	// Add event listeners
	if (throttledScrollCheck) {
		parent.value.addEventListener('scroll', throttledScrollCheck);
	}

	// Add resize listener to update last message height
	resizeHandler = () => nextTick(updateLastMessageHeight);
	window.addEventListener('resize', resizeHandler);
});

onBeforeUnmount(() => {
	if (parent.value && throttledScrollCheck) {
		parent.value.removeEventListener('scroll', throttledScrollCheck);
	}

	if (resizeHandler) {
		window.removeEventListener('resize', resizeHandler);
	}
});
</script>

<template>
	<div ref="el" :data-status="status" class="ai-message-list" :style="{ '--last-message-height': `${lastMessageHeight}px` }">
		<slot>
			<AiMessage
				v-for="message in messages"
				:key="message.id"
				:ref="(el) => registerMessageRef(message.id, el as ComponentPublicInstance)"
				v-bind="message"
				:compact="compact"
			/>
		</slot>

		<AiMessage v-if="status === 'submitted'" id="indicator" role="assistant" :parts="[]" :compact="compact">
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

		<Transition name="auto-scroll">
			<div v-if="showAutoScroll && autoScroll" class="auto-scroll-container">
				<slot name="viewport" :on-click="onAutoScrollClick">
					<v-button
						x-small
						secondary
						class="auto-scroll-button"
						icon
						rounded
						@click="onAutoScrollClick"
					>
						<v-icon name="arrow_downward" />
					</v-button>
				</slot>
			</div>
		</Transition>
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
	padding-bottom: 1rem;
	position: relative;

	:deep(article:last-of-type) {
		min-height: var(--last-message-height, 0);
	}
}

.loading-indicator {
	display: flex;
	gap: 0.375rem;
	padding: 1rem;
	align-items: center;

	span {
		width: 0.5rem;
		height: 0.5rem;
		background-color: var(--theme--foreground-subdued);
		border-radius: 50%;
		animation: loading-bounce 1.4s infinite ease-in-out both;

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
	bottom: 0;
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
	transition: opacity var(--fast) var(--transition), transform var(--fast) var(--transition);
}

.auto-scroll-enter-from,
.auto-scroll-leave-to {
	opacity: 0;
	transform: translateY(0.5rem);
}
</style>
