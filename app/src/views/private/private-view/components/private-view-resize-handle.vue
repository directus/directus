<script setup lang="ts">
const { location = 'start' } = defineProps<{ location?: 'start' | 'end' }>();
</script>

<template>
	<div :class="{ start: location === 'start' }" />
</template>

<style scoped>
div {
	position: absolute;
	opacity: 0;
	transition: opacity var(--fast) var(--transition);
	inline-size: var(--drag-handle-width);
	block-size: 100%;
	background: var(--theme--primary);
	z-index: 8;

	&:hover {
		opacity: 1;
		transition-delay: var(--medium);
	}

	&.start {
		inset-inline: calc(-1 * var(--drag-handle-width) / 2);
	}
}
</style>
