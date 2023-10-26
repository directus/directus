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
				width: value + '%',
			}"
		/>
		<slot :value="value" />
	</div>
</template>

<style>
body {
	--v-progress-linear-height: 4px;
	--v-progress-linear-color: var(--theme--foreground);
	--v-progress-linear-background-color: var(--border-normal);
	--v-progress-linear-transition: 400ms;
}
</style>

<style lang="scss" scoped>
.v-progress-linear {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: var(--v-progress-linear-height);
	overflow: hidden;
	background-color: var(--v-progress-linear-background-color);

	.inner {
		position: absolute;
		top: 0;
		left: 0;
		height: 100%;
		background-color: var(--v-progress-linear-color);
		transition: width var(--v-progress-linear-transition) ease-in-out;
	}

	&.absolute {
		position: absolute;
	}

	&.bottom {
		bottom: 0;
	}

	&.fixed {
		position: fixed;
	}

	&.indeterminate .inner {
		position: relative;
		width: 100% !important;
		transform-origin: left;
		animation: indeterminate 2s infinite;
		will-change: transform;
	}

	&.rounded,
	&.rounded .inner {
		border-radius: calc(var(--v-progress-linear-height) / 2);
	}

	&.top {
		top: 0;
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

@keyframes indeterminate {
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
</style>
