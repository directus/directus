<script setup lang="ts">
import type { SourceDocumentUIPart } from 'ai';
import VIcon from '@/components/v-icon/v-icon.vue';

defineProps<{
	part: SourceDocumentUIPart;
}>();
</script>

<template>
	<div class="message-source">
		<div class="source-document">
			<VIcon name="description" x-small />
			<span>{{ part.title }}</span>
			<small v-if="part.filename">{{ part.filename }}</small>
		</div>
	</div>
</template>

<style scoped>
.message-source {
	margin: 0.375rem 0;
}

.source-document {
	display: flex;
	flex-direction: column;
	gap: 0.1875rem;
	padding: 0.375rem 0.5625rem;
	border-radius: var(--theme--border-radius);
	background-color: var(--theme--background-subdued);
	font-size: 0.875rem;
}

small {
	color: var(--theme--foreground-subdued);
	font-size: 0.5625rem;
}
</style>
