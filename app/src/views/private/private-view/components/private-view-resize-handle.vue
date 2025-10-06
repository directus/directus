<script setup lang="ts">
import { useElementHover, useMouseInElement } from '@vueuse/core';
import { computed, useTemplateRef } from 'vue';

const { location = 'start' } = defineProps<{ location?: 'start' | 'end' }>();

const draggerEl = useTemplateRef('private-view-resize-handle');

const isHovering = useElementHover(draggerEl);
const { elementY, elementHeight } = useMouseInElement(draggerEl);

const mousePosPercentage = computed(() => isHovering.value ? Math.round(elementY.value / elementHeight.value * 100) : 0);
const fromPosition = computed(() => isHovering.value ? Math.max(0, mousePosPercentage.value - 25) : 0);
const toPosition = computed(() => isHovering.value ? Math.min(100, mousePosPercentage.value + 25) : 0);
</script>

<template>
	<div
		ref="private-view-resize-handle"
		:style="`
			--from: ${fromPosition}%;
			--via: ${mousePosPercentage}%;
			--to: ${toPosition}%;
		`"
		:class="{ '-right-px': location === 'start' }"
		class="
			absolute my-3 h-[calc(100%-(--spacing(6)))] w-px bg-linear-to-b from-transparent via-primary-300 to-transparent
			opacity-0 transition delay-0
			hover:opacity-100 hover:delay-200
		"
	/>
</template>

<style scoped>
div {
	position: absolute;
	opacity: 0;
	transition: opacity var(--fast) var(--transition);
	inline-size: 1px;
	block-size: 100%;
	background: linear-gradient(to bottom, transparent var(--from), var(--theme--primary) var(--via), transparent var(--to));
	inset-inline: -1px;

	&:hover {
		opacity: 1;
		transition-delay: 200ms;
	}
}
</style>
