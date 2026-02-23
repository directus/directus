<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, useTemplateRef } from 'vue';
import { useVisualElementHighlight } from '../composables/use-visual-element-highlight';
import { useAiContextStore } from '../stores/use-ai-context';
import { isFileContext, isLocalFileContext, type PendingContextItem } from '../types';
import AiContextCard from './ai-context-card.vue';
import { getAssetUrl } from '@/utils/get-asset-url';
import FileLightbox from '@/views/private/components/file-lightbox.vue';

const contextStore = useAiContextStore();
const { highlight, clearHighlight } = useVisualElementHighlight();

const lightboxActive = ref(false);
const activeItem = ref<PendingContextItem | null>(null);

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
		// -1 accounts for sub-pixel rounding in scrollWidth
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

function handleRemove(item: PendingContextItem) {
	clearHighlight();
	contextStore.removePendingContext(item.id);
}

function isImageFile(item: PendingContextItem): boolean {
	if (isLocalFileContext(item)) {
		return item.data.file.type.startsWith('image/');
	}

	if (isFileContext(item)) {
		return item.data.type?.startsWith('image/') ?? false;
	}

	return false;
}

function getImageUrl(item: PendingContextItem): string | undefined {
	if (!isImageFile(item)) return undefined;

	if (isLocalFileContext(item)) {
		return item.data.thumbnailUrl;
	}

	if (isFileContext(item)) {
		if (item.data.type?.includes('svg')) {
			return getAssetUrl(item.data.id);
		}

		return getAssetUrl(item.data.id, { key: 'system-small-cover' });
	}

	return undefined;
}

function handleCardClick(item: PendingContextItem) {
	if (isImageFile(item)) {
		activeItem.value = item;
		lightboxActive.value = true;
	}
}

const activeFile = computed(() => {
	if (!activeItem.value) return null;

	const item = activeItem.value;

	if (isLocalFileContext(item)) {
		return {
			id: '',
			title: item.display,
			type: item.data.file.type,
			modified_on: new Date().toISOString(),
			width: 0,
			height: 0,
		};
	}

	if (isFileContext(item)) {
		return {
			id: item.data.id,
			title: item.data.title || item.display,
			type: item.data.type,
			modified_on: new Date().toISOString(),
			width: 0,
			height: 0,
		};
	}

	return null;
});

const activeSrc = computed(() => {
	if (!activeItem.value) return undefined;
	return getImageUrl(activeItem.value);
});
</script>

<template>
	<div
		v-if="contextStore.pendingContext && contextStore.pendingContext.length > 0"
		class="ai-pending-context-wrapper"
		:class="{
			'show-left-fade': showLeftFade,
			'show-right-fade': showRightFade,
		}"
	>
		<div ref="scroll-container" class="ai-pending-context" @scroll="updateFades">
			<AiContextCard
				v-for="item in contextStore.pendingContext"
				:key="item.id"
				:item="item"
				:image-url="getImageUrl(item)"
				removable
				@click="handleCardClick(item)"
				@remove="handleRemove(item)"
				@mouseenter="highlight(item)"
				@mouseleave="clearHighlight()"
			/>
		</div>

		<FileLightbox v-if="activeFile" v-model="lightboxActive" :file="activeFile" :src="activeSrc" />
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
