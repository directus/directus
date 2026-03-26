<script setup lang="ts">
const { location = 'start' } = defineProps<{ location?: 'start' | 'end' }>();
</script>

<template>
	<div :class="{ start: location === 'start' }" />
</template>

<style scoped>
div {
	--width: 3px; /* stylelint-disable-line unit-disallowed-list -- line */

	position: absolute;
	opacity: 0;
	transition: opacity var(--fast) var(--transition);
	inline-size: var(--width);
	block-size: 100%;
	background: var(--theme--primary);
	z-index: 8;

	&:hover {
		opacity: 1;
		transition-delay: var(--medium);
	}

	&.start {
		inset-inline: calc(-1 * var(--width) / 2);
	}
}
</style>
