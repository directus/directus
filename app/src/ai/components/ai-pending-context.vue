<script setup lang="ts">
import { onMounted, onUnmounted, ref, useTemplateRef } from 'vue';
import { useAiStore } from '../stores/use-ai';
import { isVisualElement, type PendingContextItem } from '../types';
import AiContextCard from './ai-context-card.vue';

const aiStore = useAiStore();

const scrollContainerRef = useTemplateRef<HTMLElement>('scroll-container');
const showLeftFade = ref(false);
const showRightFade = ref(false);

let resizeObserver: ResizeObserver | null = null;

function updateFades() {
	const el = scrollContainerRef.value;

	if (!el) return;

	const hasOverflow = el.scrollWidth > el.clientWidth;

	if (hasOverflow) {
		showLeftFade.value = el.scrollLeft > 0;
		showRightFade.value = el.scrollLeft < el.scrollWidth - el.clientWidth - 1;
	} else {
		showLeftFade.value = false;
		showRightFade.value = false;
	}
}

onMounted(() => {
	updateFades();

	if (scrollContainerRef.value) {
		resizeObserver = new ResizeObserver(updateFades);
		resizeObserver.observe(scrollContainerRef.value);
	}
});

onUnmounted(() => {
	resizeObserver?.disconnect();
});

function handleMouseEnter(item: PendingContextItem) {
	if (isVisualElement(item)) {
		aiStore.highlightVisualElement(item.data.key);
	}
}

function handleMouseLeave(item: PendingContextItem) {
	if (isVisualElement(item)) {
		aiStore.highlightVisualElement(null);
	}
}

function handleRemove(item: PendingContextItem) {
	if (isVisualElement(item)) {
		aiStore.highlightVisualElement(null);
	}

	aiStore.removePendingContext(item.id);
}
</script>

<template>
	<div
		v-if="aiStore.pendingContext && aiStore.pendingContext.length > 0"
		class="ai-pending-context-wrapper"
		:class="{
			'show-left-fade': showLeftFade,
			'show-right-fade': showRightFade,
		}"
	>
		<div ref="scroll-container" class="ai-pending-context" @scroll="updateFades">
			<AiContextCard
				v-for="item in aiStore.pendingContext"
				:key="item.id"
				:item="item"
				removable
				@remove="handleRemove(item)"
				@mouseenter="handleMouseEnter(item)"
				@mouseleave="handleMouseLeave(item)"
			/>
		</div>
	</div>
</template>

<style scoped>
.ai-pending-context-wrapper {
	--fade-size: 24px;
	--fade-color: var(--theme--form--field--input--background);

	position: relative;
	inline-size: 100%;
	min-inline-size: 0;

	/* Left fade */
	&::before,
	&::after {
		content: '';
		position: absolute;
		inset-block: 0;
		inline-size: var(--fade-size);
		pointer-events: none;
		z-index: 1;
		opacity: 0;
		transition: opacity var(--fast) var(--transition);
	}

	&::before {
		inset-inline-start: 0;
		background: linear-gradient(to right, var(--fade-color), transparent);
	}

	&::after {
		inset-inline-end: 0;
		background: linear-gradient(to left, var(--fade-color), transparent);
	}

	/* Show fades based on scroll state via CSS custom properties set by JS */
	&.show-left-fade::before {
		opacity: 1;
	}

	&.show-right-fade::after {
		opacity: 1;
	}
}

.ai-pending-context {
	display: flex;
	flex-wrap: nowrap;
	gap: 8px;
	inline-size: 100%;
	min-inline-size: 0;
	overflow: auto hidden;
	padding-block-end: 4px;

	/* Styled scrollbar for Firefox */
	scrollbar-width: thin;
	scrollbar-color: var(--theme--border-color-accent) transparent;

	/* Styled scrollbar for WebKit browsers */
	&::-webkit-scrollbar {
		block-size: 6px;
	}

	&::-webkit-scrollbar-track {
		background: transparent;
		border-radius: 3px;
	}

	&::-webkit-scrollbar-thumb {
		background: var(--theme--border-color);
		border-radius: 3px;
		transition: background var(--fast) var(--transition);

		&:hover {
			background: var(--theme--border-color-accent);
		}
	}
}
</style>
