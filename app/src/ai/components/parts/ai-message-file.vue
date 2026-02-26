<script setup lang="ts">
import type { FileUIPart } from 'ai';
import { computed, ref } from 'vue';
import { fileExtension, isImagePreview, toLightboxFile } from './file-ui-part-utils';
import VIconFile from '@/components/v-icon-file.vue';
import VImage from '@/components/v-image.vue';
import FileLightbox from '@/views/private/components/file-lightbox.vue';

const props = defineProps<{
	part: FileUIPart;
}>();

const lightboxActive = ref(false);

const hasImagePreview = computed(() => isImagePreview(props.part));
const ext = computed(() => fileExtension(props.part.mediaType));
const file = computed(() => toLightboxFile(props.part));
</script>

<template>
	<div class="message-file">
		<button
			v-if="hasImagePreview"
			type="button"
			class="image-preview"
			:aria-label="part.filename || $t('ai.image_preview')"
			@click="lightboxActive = true"
		>
			<VImage :src="part.url" :alt="part.filename || $t('ai.image_preview')" />
		</button>
		<div v-else class="file-attachment">
			<VIconFile :ext="ext" class="file-icon" />
			<span>{{ part.filename || $t('file') }}</span>
		</div>

		<FileLightbox v-if="hasImagePreview" v-model="lightboxActive" :file="file" :src="part.url" />
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

	.file-icon {
		flex-shrink: 0;

		--v-icon-size: 34px;
		--v-icon-file-label-size: 7px;
	}
}
</style>
