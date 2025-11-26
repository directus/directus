<script setup lang="ts">
import { computed, inject } from 'vue';
import { fieldAnimationsKey } from './composables/use-field-animations';

const props = defineProps<{
	field: string;
}>();

const fieldAnimations = inject(fieldAnimationsKey);

const animationKey = computed(() => fieldAnimations?.getAnimationKey(props.field));
const animationDelay = computed(() => fieldAnimations?.getAnimationDelay(props.field) ?? 0);

function onAnimationEnd(event: AnimationEvent) {
	if (event.animationName !== 'cursor-appear') return;
	fieldAnimations?.clearAnimation(props.field);
}
</script>

<template>
	<div :key="animationKey" class="field-animations">
		<div class="field-animation-border" />
		<div class="field-animation-shimmer" />
		<div class="field-cursor" @animationend="onAnimationEnd">
			<v-icon name="magic_button" />
		</div>
	</div>
</template>

<style lang="scss" scoped>

.field-animations {
	display: contents;

	--animation-length: 2s;
	--animation-delay: v-bind(`${animationDelay}ms`);
}

.field-animation-border {
	position: absolute;
	inset: -4px;
	border-radius: var(--theme--border-radius);
	pointer-events: none;
	box-shadow: 0 0 0 2px var(--theme--primary);
	opacity: 0;
	animation: border-pulse var(--animation-length) ease-out var(--animation-delay, 0ms);
	z-index: 2;
}

.field-animation-shimmer {
	position: absolute;
	inset: 0;
	border-radius: var(--theme--border-radius);
	pointer-events: none;
	background: linear-gradient(
		90deg,
		transparent 0%,
		transparent 25%,
		var(--theme--primary-background) 50%,
		transparent 75%,
		transparent 100%
	);
	opacity: 0;
	animation: text-shimmer-sweep var(--animation-length) ease-out var(--animation-delay, 0ms);
	background-size: 200% 100%;
	mix-blend-mode: soft-light;
	z-index: 3;
	overflow: hidden;
}

.field-cursor {
	position: absolute;
	inset-block-start: 0;
	inset-inline-end: 0;
	pointer-events: none;
	z-index: 10;
	color: var(--theme--primary);
	font-size: 32px;
	opacity: 0;
	animation: cursor-appear var(--animation-length) ease-out var(--animation-delay, 0ms);
}

@keyframes border-pulse {
	0% {
		opacity: 0;
	}

	10% {
		opacity: 0.9;
	}

	25% {
		opacity: 0.7;
	}

	75% {
		opacity: 0.5;
	}

	90% {
		opacity: 0.2;
	}

	100% {
		opacity: 0;
	}
}

@keyframes text-shimmer-sweep {
	0% {
		opacity: 0;
		background-position: 250% 0;
	}

	10% {
		opacity: 0.8;
	}

	20% {
		opacity: 1;
		background-position: 150% 0;
	}

	60% {
		opacity: 1;
		background-position: -50% 0;
	}

	70% {
		opacity: 0.8;
	}

	100% {
		opacity: 0;
		background-position: -150% 0;
	}
}

@keyframes cursor-appear {
	0% {
		opacity: 0;
		transform: scale(0.5) rotate(-10deg);
	}

	15% {
		opacity: 1;
		transform: scale(1.1) rotate(0deg);
	}

	25% {
		opacity: 1;
		transform: scale(1) rotate(0deg);
	}

	85% {
		opacity: 1;
		transform: scale(1) rotate(0deg);
	}

	100% {
		opacity: 0;
		transform: scale(0.8) rotate(5deg);
	}
}
</style>
