<script setup lang="ts">
import type { FileUIPart } from 'ai';

defineProps<{
	part: FileUIPart;
}>();
</script>

<template>
	<div class="message-file">
		<v-image v-if="part.mediaType?.startsWith('image/')" :src="part.url" :alt="part.filename" />
		<div v-else class="file-attachment">
			<v-icon name="attach_file" small />
			<span>{{ part.filename || $t('file') }}</span>
		</div>
	</div>
</template>

<style scoped>
.message-file {
	margin: 0.5rem 0;

	.v-image {
		max-inline-size: 100%;
		border-radius: var(--theme--border-radius);
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
