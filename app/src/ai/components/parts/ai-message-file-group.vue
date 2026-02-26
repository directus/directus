<script setup lang="ts">
import type { FileUIPart } from 'ai';
import { computed, ref } from 'vue';
import AiMessageFile from './ai-message-file.vue';
import { isImagePreview, toLightboxFile } from './file-ui-part-utils';
import VImage from '@/components/v-image.vue';
import FileLightbox from '@/views/private/components/file-lightbox.vue';

const props = defineProps<{
	parts: FileUIPart[];
}>();

const activeIndex = ref<number | null>(null);

const lightboxActive = computed({
	get: () => activeIndex.value !== null,
	set: (value: boolean) => {
		if (!value) activeIndex.value = null;
	},
});

const useGrid = computed(() => props.parts.length > 1 && props.parts.every(isImagePreview));
const activePart = computed(() => (activeIndex.value !== null ? (props.parts[activeIndex.value] ?? null) : null));
const activeFile = computed(() => (activePart.value ? toLightboxFile(activePart.value) : null));

function openLightbox(index: number) {
	activeIndex.value = index;
}
</script>

<template>
	<div class="message-file-group">
		<div v-if="useGrid" class="message-file-grid">
			<button
				v-for="(part, index) in parts"
				:key="`${part.filename || 'file'}-${index}`"
				type="button"
				class="grid-item"
				:aria-label="part.filename || $t('ai.image_preview')"
				@click="openLightbox(index)"
			>
				<VImage :src="part.url" :alt="part.filename || $t('ai.image_preview')" />
			</button>
		</div>
		<template v-else>
			<AiMessageFile v-for="(part, index) in parts" :key="`${part.filename || 'file'}-${index}`" :part="part" />
		</template>

		<FileLightbox v-if="activePart && activeFile" v-model="lightboxActive" :file="activeFile" :src="activePart.url" />
	</div>
</template>

<style scoped>
.message-file-group {
	container-type: inline-size;
	inline-size: 100%;
	max-inline-size: 18rem;
	margin-inline-start: auto;
	padding: calc(var(--focus-ring-width) + var(--focus-ring-offset));
}

.message-file-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 0.375rem;
}

@container (min-width: 11rem) {
	.message-file-grid {
		grid-template-columns: repeat(3, minmax(0, 1fr));
	}
}

@container (min-width: 14rem) {
	.message-file-grid {
		grid-template-columns: repeat(4, minmax(0, 1fr));
	}
}

.grid-item {
	cursor: zoom-in;
	inline-size: 100%;
	border-radius: var(--theme--border-radius);
	overflow: hidden;
	padding: 0;
	border: none;
	background: none;
	display: block;
}

.grid-item:focus-visible {
	outline: var(--focus-ring-width) solid var(--focus-ring-color);
	outline-offset: var(--focus-ring-offset);
	border-radius: var(--focus-ring-radius);
}

.grid-item :deep(img) {
	inline-size: 100%;
	block-size: 100%;
	object-fit: cover;
	aspect-ratio: 1;
	display: block;
}
</style>
