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
		backgroundColor: {
			type: String,
			default: '--progress-background-color'
		},
		bottom: {
			type: Boolean,
			default: false
		},
		color: {
			type: String,
			default: '--progress-background-color-accent'
		},
		fixed: {
			type: Boolean,
			default: false
		},
		height: {
			type: Number,
			default: 4
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
	},
	setup(props) {
		const styles = computed<object>(() => ({
			'--_v-progress-linear-background-color': parseCSSVar(props.backgroundColor),
			'--_v-progress-linear-color': parseCSSVar(props.color),
			'--_v-progress-linear-height': props.height + 'px'
		}));

		return { styles };
	}
});
</script>

<style lang="scss" scoped>
.v-progress-linear {
	background-color: var(--_v-progress-linear-background-color);
	height: var(--_v-progress-linear-height);
	position: relative;
	width: 100%;
	display: flex;
	justify-content: center;
	align-items: center;
	overflow: hidden;

	.inner {
		top: 0;
		left: 0;
		position: absolute;
		height: 100%;
		background-color: var(--_v-progress-linear-color);
	}

	&.absolute {
		position: absolute;
	}

	&.bottom {
		bottom: 0px;
	}

	&.fixed {
		position: fixed;
	}

	&.indeterminate .inner {
		width: 100% !important;
		transform-origin: left;
		will-change: transform;
		animation: indeterminate 2s infinite;
		position: relative;
	}

	&.rounded,
	&.rounded .inner {
		border-radius: calc(var(--_v-progress-linear-height) / 2);
	}

	&.top {
		top: 0px;
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
