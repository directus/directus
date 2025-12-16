<script setup lang="ts">
import VIcon from '@/components/v-icon/v-icon.vue';
import type { SourceUrlUIPart } from 'ai';

defineProps<{
	part: SourceUrlUIPart;
}>();
</script>

<template>
	<div class="message-source">
		<a :href="part.url" target="_blank" rel="noopener noreferrer">
			<v-icon name="link" x-small />
			<span>{{ part.title || part.url }}</span>
		</a>
	</div>
</template>

<style scoped>
.message-source {
	margin: 0.5rem 0;

	a {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 0.75rem;
		border-radius: var(--theme--border-radius);
		background-color: var(--theme--background-subdued);
		color: var(--theme--primary);
		text-decoration: none;
		font-size: 0.875rem;
		transition: background-color var(--fast) var(--transition);

		&:hover {
			background-color: var(--theme--background-normal);
		}
	}
}
</style>
