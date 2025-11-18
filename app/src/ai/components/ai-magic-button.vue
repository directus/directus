<script lang="ts" setup>
import { ref, watch } from 'vue';

const { animate = false } = defineProps<{ animate?: boolean }>();

const isAnimating = ref(false);

watch(() => animate, (newAnimate) => {
	if (newAnimate) isAnimating.value = true;
});

const onAnimationIteration = () => {
	if (animate === false) isAnimating.value = false;
}
</script>

<template>
	<svg class="ai-magic-button" :class="{ animate: isAnimating }" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
		<path class="left" @animationiteration="onAnimationIteration" />
		<path class="right" />
	</svg>
</template>

<style scoped>
.ai-magic-button {
	overflow: visible;

	.left, .right {
		fill: black;
		transform-origin: center center;
		animation-duration: 1s;
		animation-timing-function: ease-in;
		animation-iteration-count: 1;
		animation-play-state: paused;
	}

	.left {
		d: path("M12 15.175L13 13L15.175 12L13 11L12 8.825L11 11L8.825 12L11 13L12 15.175ZM12 20L9.5 14.5L4 12L9.5 9.5L12 4L14.5 9.5L20 12L14.5 14.5L12 20Z");
		translate: -2px -1px;
		animation-delay: -800ms;
	}

	.right {
		d: path("M12 12L12 12L12 12L12 12L12 12L12 12L12 12L12 12L12 12ZM12 16L10.75 13.25L8 12L10.75 10.75L12 8L13.25 10.75L16 12L13.25 13.25L12 16Z");
		translate: 6px 5px;
		animation-delay: -300ms;
	}

	&.animate {
		.left, .right {
			animation-play-state: running;
			animation-iteration-count: infinite;
		}

		.left {
			animation-name: sparkle-left;
		}

		.right {
			animation-name: sparkle-right;
		}
	}
}

@keyframes sparkle-left {
	0% {
		opacity: 0;
		translate: -2px 8px;
		d: path("M12 12L12 12L12 12L12 12L12 12L12 12L12 12L12 12L12 12ZM12 16L10.75 13.25L8 12L10.75 10.75L12 8L13.25 10.75L16 12L13.25 13.25L12 16Z");
	}

	30% {
		opacity: 1;
	}

	80% {
		opacity: 1;
		translate: -2px -1px;
		d: path("M12 15.175L13 13L15.175 12L13 11L12 8.825L11 11L8.825 12L11 13L12 15.175ZM12 20L9.5 14.5L4 12L9.5 9.5L12 4L14.5 9.5L20 12L14.5 14.5L12 20Z");
	}

	100% {
		opacity: 0;
		translate: -2px -4px;
	}
}

@keyframes sparkle-right {
	0% {
		opacity: 0;
		translate: 6px 5px;
		d: path("M12 12L12 12L12 12L12 12L12 12L12 12L12 12L12 12L12 12ZM12 16L10.75 13.25L8 12L10.75 10.75L12 8L13.25 10.75L16 12L13.25 13.25L12 16Z");
	}

	30% {
		opacity: 1;
	}

	80% {
		opacity: 1;
		translate: 6px -1px;
		d: path("M12 15.175L13 13L15.175 12L13 11L12 8.825L11 11L8.825 12L11 13L12 15.175ZM12 20L9.5 14.5L4 12L9.5 9.5L12 4L14.5 9.5L20 12L14.5 14.5L12 20Z");
	}

	100% {
		opacity: 0;
		translate: 6px -4px;
	}
}
</style>
