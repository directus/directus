<template>
	<div
		class="v-progress-linear"
		:style="styles"
		:class="{
			absolute,
			bottom,
			fixed,
			indeterminate,
			rounded,
			top
		}"
	>
		<div
			class="inner"
			:style="{
				width: value + '%'
			}"
		/>
		<slot :value="value" />
	</div>
</template>

<script lang="ts">
import { createComponent, computed } from '@vue/composition-api';
import parseCSSVar from '@/utils/parse-css-var';

export default createComponent({
	props: {
		absolute: {
			type: Boolean,
			default: false
		},
		bottom: {
			type: Boolean,
			default: false
		},
		fixed: {
			type: Boolean,
			default: false
		},
		indeterminate: {
			type: Boolean,
			default: false
		},
		rounded: {
			type: Boolean,
			default: false
		},
		top: {
			type: Boolean,
			default: false
		},
		value: {
			type: Number,
			default: 0
		}
	}
});
</script>

<style lang="scss" scoped>
.v-progress-linear {
	--v-progress-linear-height: 4px;
	--v-progress-linear-color: var(--input-foreground-color);
	--v-progress-linear-background-color: var(--input-border-color);

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
		transform: scaleX(0);
		animation-timing-function: cubic-bezier(0.1, 0.6, 0.9, 0.5);
	}

	50% {
		transform: scaleX(1) translateX(25%);
		animation-timing-function: cubic-bezier(0.4, 0.1, 0.2, 0.9);
	}

	100% {
		transform: scaleX(1) translateX(100%);
		animation-timing-function: cubic-bezier(0.1, 0.6, 0.9, 0.5);
	}
}
</style>
