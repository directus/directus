<script setup lang="ts">
import type { FileUIPart } from 'ai';
import { computed, ref } from 'vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VImage from '@/components/v-image.vue';
import FileLightbox from '@/views/private/components/file-lightbox.vue';

const props = defineProps<{
	part: FileUIPart;
}>();

const lightboxActive = ref(false);

const file = computed(() => ({
	id: '', // Not used for local files/data URLs in this context
	title: props.part.filename || '',
	type: props.part.mediaType || 'application/octet-stream',
	modified_on: new Date().toISOString(),
	width: 0,
	height: 0,
	data: props.part.url, // Pass the data URL directly if supported by file-preview or handle it
}));
</script>

<template>
	<div class="message-file">
		<button
			v-if="part.mediaType?.startsWith('image/')"
			type="button"
			class="image-preview"
			:aria-label="part.filename || $t('ai.image_preview')"
			@click="lightboxActive = true"
		>
			<VImage :src="part.url" :alt="part.filename || $t('ai.image_preview')" />
		</button>
		<div v-else class="file-attachment">
			<VIcon name="attach_file" small />
			<span>{{ part.filename || $t('file') }}</span>
		</div>

		<FileLightbox v-model="lightboxActive" :file="file" :src="part.url" />
	</div>
</template>

<style scoped>
.message-file {
	margin: 0.5rem 0;

	.image-preview {
		cursor: zoom-in;
		inline-size: 100%;
		max-inline-size: 128px;
		border-radius: var(--theme--border-radius);
		overflow: hidden;
		padding: 0;
		border: none;
		background: none;
		display: block;
	}

	img {
		inline-size: 100%;
		block-size: 100%;
		object-fit: cover;
		aspect-ratio: 1;
		display: block;
	}

	.file-attachment {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem;
		border-radius: var(--theme--border-radius);
		background-color: var(--theme--background-subdued);
		border: 1px solid var(--theme--border-color-subdued);
	}
}
</style>
