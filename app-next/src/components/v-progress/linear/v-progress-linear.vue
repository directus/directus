<template>
	<div
		class="v-progress-linear"
		:class="{
			absolute,
			bottom,
			fixed,
			indeterminate,
			rounded,
			top,
		}"
		@animationiteration="$emit('animationiteration')"
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

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
	props: {
		absolute: {
			type: Boolean,
			default: false,
		},
		bottom: {
			type: Boolean,
			default: false,
		},
		fixed: {
			type: Boolean,
			default: false,
		},
		indeterminate: {
			type: Boolean,
			default: false,
		},
		rounded: {
			type: Boolean,
			default: false,
		},
		top: {
			type: Boolean,
			default: false,
		},
		value: {
			type: Number,
			default: 0,
		},
	},
});
</script>

<style>
body {
	--v-progress-linear-height: 4px;
	--v-progress-linear-color: var(--foreground-normal);
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
