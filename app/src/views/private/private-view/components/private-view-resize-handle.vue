<script setup lang="ts">
import { useElementHover, useMouseInElement } from '@vueuse/core';
import { computed, useTemplateRef } from 'vue';

const { location = 'start' } = defineProps<{ location?: 'start' | 'end' }>();

const draggerEl = useTemplateRef('private-view-resize-handle');

const isHovering = useElementHover(draggerEl);
const { elementY, elementHeight } = useMouseInElement(draggerEl);

const mousePosPercentage = computed(() =>
	isHovering.value ? Math.round((elementY.value / elementHeight.value) * 100) : 0,
);

const fromPosition = computed(() => (isHovering.value ? Math.max(0, mousePosPercentage.value - 25) : 0));
const toPosition = computed(() => (isHovering.value ? Math.min(100, mousePosPercentage.value + 25) : 0));
</script>

<template>
	<div
		ref="private-view-resize-handle"
		:style="`
			--from: ${fromPosition}%;
			--via: ${mousePosPercentage}%;
			--to: ${toPosition}%;
		`"
		:class="{ start: location === 'start' }"
	/>
</template>

<style scoped>
div {
	position: absolute;
	opacity: 0;
	transition: opacity var(--fast) var(--transition);
	inline-size: 1px;
	block-size: 100%;
	background: linear-gradient(
		to bottom,
		transparent var(--from),
		var(--theme--primary) var(--via),
		transparent var(--to)
	);
	z-index: 4;

	&:hover {
		opacity: 1;
		transition-delay: var(--medium);
	}

	&.start {
		inset-inline: -1px;
	}
}
</style>
