<script setup lang="ts">
import type { SourceUrlUIPart } from 'ai';
import VIcon from '@/components/v-icon/v-icon.vue';

defineProps<{
	part: SourceUrlUIPart;
}>();
</script>

<template>
	<div class="message-source">
		<a :href="part.url" target="_blank" rel="noopener noreferrer">
			<VIcon name="link" x-small />
			<span>{{ part.title || part.url }}</span>
		</a>
	</div>
</template>

<style scoped>
.message-source {
	margin: 0.375rem 0;

	a {
		display: inline-flex;
		align-items: center;
		gap: 0.3125rem;
		padding: 0.375rem 0.5625rem;
		border-radius: var(--theme--border-radius);
		background-color: var(--theme--background-subdued);
		color: var(--theme--primary);
		text-decoration: none;
		font-size: 0.6875rem;
		transition: background-color var(--fast) var(--transition);

		&:hover {
			background-color: var(--theme--background-normal);
		}
	}
}
</style>
