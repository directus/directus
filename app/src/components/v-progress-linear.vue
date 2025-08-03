<script setup lang="ts">
import { computed } from 'vue';

interface Props {
	/** Sets position to absolute */
	absolute?: boolean;
	/** Positions the bar at the bottom */
	bottom?: boolean;
	/** Sets position to fixed */
	fixed?: boolean;
	/** Play a general loading animation */
	indeterminate?: boolean;
	/** Rounds up the corners of the progress */
	rounded?: boolean;
	/** Positions the bar at the top */
	top?: boolean;
	/** Which value to represent from 0 to 100 */
	value?: number;
	/** Adds color to progress linear depending on the current percentage */
	colorful?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	absolute: false,
	bottom: false,
	fixed: false,
	indeterminate: false,
	rounded: false,
	top: false,
	value: 0,
	colorful: false,
});

defineEmits(['animationiteration']);

const color = computed(() => {
	if (props.value <= 33) return 'danger';
	if (props.value <= 66) return 'warning';
	return 'success';
});
</script>

<template>
	<div
		class="v-progress-linear"
		:class="[
			{
				absolute,
				bottom,
				fixed,
				indeterminate,
				rounded,
				top,
				colorful,
			},
			color,
		]"
		@animationiteration="$emit('animationiteration', $event)"
	>
		<div
			class="inner"
			:style="{
				inlineSize: value + '%',
			}"
		/>
		<slot :value="value" />
	</div>
</template>

<style lang="scss" scoped>
/*

	Available Variables:

	--v-progress-linear-height            [4px]
	--v-progress-linear-color             [var(--theme--foreground)]
	--v-progress-linear-background-color  [var(--theme--form--field--input--border-color)]

*/

.v-progress-linear {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	inline-size: 100%;
	block-size: var(--v-progress-linear-height, 4px);
	overflow: hidden;
	background-color: var(--v-progress-linear-background-color, var(--theme--form--field--input--border-color));

	.inner {
		position: absolute;
		inset-block-start: 0;
		inset-inline-start: 0;
		block-size: 100%;
		background-color: var(--v-progress-linear-color, var(--theme--foreground));
		transition: inline-size 200ms ease-in-out;
	}

	&.absolute {
		position: absolute;
	}

	&.bottom {
		inset-block-end: 0;
	}

	&.fixed {
		position: fixed;
	}

	&.indeterminate .inner {
		position: relative;
		inline-size: 100% !important;
		transform-origin: left;
		will-change: transform;
		animation: indeterminate-ltr 2s infinite;

		html[dir='rtl'] & {
			animation: indeterminate-rtl 2s infinite;
			transform-origin: right;
		}
	}

	&.rounded,
	&.rounded .inner {
		border-radius: calc(var(--v-progress-linear-height, 4px) / 2);
	}

	&.top {
		inset-block-start: 0;
	}

	&.colorful {
		&.danger .inner {
			background-color: var(--theme--danger);
		}

		&.warning .inner {
			background-color: var(--theme--warning);
		}

		&.success .inner {
			background-color: var(--theme--success);
		}
	}
}

@keyframes indeterminate-ltr {
	0% {
		transform: scaleX(0) translateX(-30%);
	}

	10% {
		transform: scaleX(0) translateX(-30%);
		animation-timing-function: cubic-bezier(0.1, 0.6, 0.9, 0.5);
	}

	60% {
		transform: scaleX(1) translateX(25%);
		animation-timing-function: cubic-bezier(0.4, 0.1, 0.2, 0.9);
	}

	100% {
		transform: scaleX(1) translateX(100%);
		animation-timing-function: cubic-bezier(0.1, 0.6, 0.9, 0.5);
	}
}

@keyframes indeterminate-rtl {
	0% {
		transform: scaleX(0) translateX(30%);
	}

	10% {
		transform: scaleX(0) translateX(30%);
		animation-timing-function: cubic-bezier(0.1, 0.6, 0.9, 0.5);
	}

	60% {
		transform: scaleX(1) translateX(-25%);
		animation-timing-function: cubic-bezier(0.4, 0.1, 0.2, 0.9);
	}

	100% {
		transform: scaleX(1) translateX(-100%);
		animation-timing-function: cubic-bezier(0.1, 0.6, 0.9, 0.5);
	}
}
</style>
