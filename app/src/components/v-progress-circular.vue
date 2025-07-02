<script setup lang="ts">
import { computed } from 'vue';
import { useSizeClass } from '@directus/composables';

interface Props {
	/** If set to true displays no value but spins indefinitely */
	indeterminate?: boolean;
	/** Which value to represent going from 0 to 100 */
	value?: number;
	/** Renders the progress circular smaller */
	xSmall?: boolean;
	/** Renders the progress circular small */
	small?: boolean;
	/** Renders the progress circular large */
	large?: boolean;
	/** Renders the progress circular larger */
	xLarge?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	indeterminate: false,
	value: 0,
});

defineEmits(['animationiteration']);

const sizeClass = useSizeClass(props);

const circleStyle = computed(() => ({
	'stroke-dasharray': (props.value / 100) * 78.5 + ', 78.5',
}));
</script>

<template>
	<div class="v-progress-circular" :class="sizeClass">
		<svg
			class="circle"
			viewBox="0 0 30 30"
			:class="{ indeterminate }"
			@animationiteration="$emit('animationiteration', $event)"
		>
			<path
				class="circle-background"
				d="M12.5,0A12.5,12.5,0,1,1,0,12.5,12.5,12.5,0,0,1,12.5,0Z"
				transform="translate(2.5 2.5)"
			/>
			<path
				class="circle-path"
				:style="circleStyle"
				d="M12.5,0A12.5,12.5,0,1,1,0,12.5,12.5,12.5,0,0,1,12.5,0Z"
				transform="translate(2.5 2.5)"
			/>
		</svg>
		<slot />
	</div>
</template>

<style lang="scss" scoped>
/*

	Available Variables:

		--v-progress-circular-color             [var(--theme--foreground)]
		--v-progress-circular-background-color  [var(--theme--form--field--input--border-color)]
		--v-progress-circular-transition        [400ms]
		--v-progress-circular-speed             [2s]
		--v-progress-circular-size              [28px]
		--v-progress-circular-line-size         [3px]

*/

.v-progress-circular {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	inline-size: var(--v-progress-circular-size, 28px);
	block-size: var(--v-progress-circular-size, 28px);

	&.x-small {
		--v-progress-circular-size: 12px;
		--v-progress-circular-line-size: 4px;
	}

	&.small {
		--v-progress-circular-size: 20px;
		--v-progress-circular-line-size: 3px;

		margin: 2px;
	}

	&.large {
		--v-progress-circular-size: 48px;
		--v-progress-circular-line-size: 2.5px;
	}

	&.x-large {
		--v-progress-circular-size: 64px;
		--v-progress-circular-line-size: 2px;
	}

	.circle {
		position: absolute;
		inset-block-start: 0;
		inset-inline-start: 0;
		inline-size: var(--v-progress-circular-size, 28px);
		block-size: var(--v-progress-circular-size, 28px);

		&-path {
			transition: stroke-dasharray var(--v-progress-circular-transition, 400ms) ease-in-out;
			fill: transparent;
			stroke: var(--v-progress-circular-color, var(--theme--foreground));
			stroke-width: var(--v-progress-circular-line-size, 3px);
		}

		&.indeterminate {
			animation: rotate var(--v-progress-circular-speed, 2s) infinite linear;

			.circle-path {
				animation: stroke var(--v-progress-circular-speed, 2s) infinite linear;
			}
		}

		&-background {
			fill: transparent;
			stroke: var(--v-progress-circular-background-color, var(--theme--form--field--input--border-color));
			stroke-width: var(--v-progress-circular-line-size, 3px);
		}
	}
}

@keyframes rotate {
	0% {
		transform: rotate(0deg);
	}

	50% {
		transform: rotate(360deg);
	}

	100% {
		transform: rotate(1080deg);
	}
}

@keyframes stroke {
	0% {
		stroke-dasharray: 0, 78.5px;
	}

	50% {
		stroke-dasharray: 78.5px, 78.5px;
	}

	100% {
		stroke-dasharray: 0, 78.5px;
	}
}
</style>
