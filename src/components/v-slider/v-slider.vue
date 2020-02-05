<template>
	<div class="v-slider" :style="styles">
		<div v-if="$slots['prepend']" class="prepend">
			<slot name="prepend" :value="value" />
		</div>
		<div class="slider">
			<input
				type="range"
				:value="value"
				:max="max"
				:min="min"
				:step="step"
				@change="onChange"
				@input="onInput"
			/>
			<div class="fill" />
			<div v-if="showTicks" class="ticks">
				<span class="tick" v-for="i in (max - min) / step + 1" :key="i" />
			</div>
			<div v-if="showThumbLabel" class="thumb-label-wrapper">
				<div class="thumb-label">
					<slot name="thumb-label" :value="value">
						{{ value }}
					</slot>
				</div>
			</div>
		</div>
		<div v-if="$slots['append']" class="append">
			<slot name="append" :value="value" />
		</div>
	</div>
</template>

<script lang="ts">
import { createComponent, computed } from '@vue/composition-api';
import parseCSSVar from '@/utils/parse-css-var';
import { ChangeEvent } from 'react';

export default createComponent({
	props: {
		trackColor: {
			type: String,
			default: '--slider-track-color'
		},
		trackFillColor: {
			type: String,
			default: '--slider-track-fill-color'
		},
		thumbColor: {
			type: String,
			default: '--slider-thumb-color'
		},
		showThumbLabel: {
			type: Boolean,
			default: false
		},
		max: {
			type: Number,
			default: 100
		},
		min: {
			type: Number,
			default: 0
		},
		step: {
			type: Number,
			default: 1
		},
		showTicks: {
			type: Boolean,
			default: false
		},
		value: {
			type: Number,
			default: 50
		}
	},
	setup(props, { emit, listeners }) {
		const styles = computed(() => ({
			'--_v-slider-track-color': parseCSSVar(props.trackColor),
			'--_v-slider-track-fill-color': parseCSSVar(props.trackFillColor),
			'--_v-slider-thumb-color': parseCSSVar(props.thumbColor),
			'--_v-slider-percentage': ((props.value - props.min) / (props.max - props.min)) * 100
		}));

		return {
			styles,
			onChange,
			onInput
		};

		function onChange(event: ChangeEvent) {
			const target = event.target as HTMLInputElement;
			emit('change', Number(target.value));
		}

		function onInput(event: InputEvent) {
			const target = event.target as HTMLInputElement;
			emit('input', Number(target.value));
		}
	}
});
</script>

<style lang="scss" scoped>
.v-slider {
	display: flex;
	align-items: center;

	.prepend {
		margin-right: 8px;
	}

	.slider {
		flex-grow: 1;
		position: relative;
		top: -3px;

		input {
			-webkit-appearance: none;
			appearance: none;
			width: 100%;
			height: 2px;

			/*
			 * The vendor specific styling for the tracks needs to be separate into individual
			 * statements. In browsers, if one of the statements is unknown, the whole selector is
			 * invalidated. We're using these 'local' mixins to facilitate that.
			 */

			@mixin v-slider-track {
				height: 2px;
				background: var(--_v-slider-track-color);
				box-shadow: none;
				border: none;
				border-radius: 2px;
			}

			&::-webkit-slider-runnable-track {
				@include v-slider-track;
			}

			&::-moz-range-track {
				@include v-slider-track;
			}

			@mixin v-slider-thumb {
				-webkit-appearance: none;
				appearance: none;
				box-shadow: none;
				border: none;
				height: 14px;
				width: 14px;
				border-radius: 50%;
				background: var(--_v-slider-thumb-color);
				margin-top: -6px;
				cursor: ew-resize;
				box-shadow: 0 0 0 4px var(--input-background-color);
				z-index: 3;
				position: relative;
			}

			&::-webkit-slider-thumb {
				@include v-slider-thumb;
			}

			&::-moz-range-thumb {
				@include v-slider-thumb;
			}
		}

		.fill {
			position: absolute;
			left: 0;
			right: 0;
			top: 50%;
			transform: translateY(2px) scaleX(calc(var(--_v-slider-percentage) / 100));
			transform-origin: left;
			height: 2px;
			background-color: var(--_v-slider-track-fill-color);
			pointer-events: none;
			z-index: 2;
		}

		.ticks {
			opacity: 0;
			position: absolute;
			top: 11px;
			left: 0;
			width: 100%;
			height: 4px;
			pointer-events: none;
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 0 7px;
			transition: opacity var(--fast) var(--transition);

			.tick {
				display: inline-block;
				width: 4px;
				height: 4px;
				border-radius: 50%;
				background-color: var(--_v-slider-track-fill-color);
			}
		}

		.thumb-label-wrapper {
			position: absolute;
			top: 100%;
			left: 7px;
			width: calc(100% - 14px);
			overflow: visible;
		}

		.thumb-label {
			opacity: 0;
			position: absolute;
			width: max-content;
			left: calc(var(--_v-slider-percentage) * 1%);
			transform: translateX(-50%);
			top: 10px;
			color: var(--input-text-color);
			background-color: var(--input-background-color-alt);
			border-radius: var(--border-radius);
			font-size: var(--input-font-size);
			padding: 4px 8px;
			transition: opacity var(--fast) var(--transition);

			&:before {
				content: '';
				position: absolute;
				top: -4px;
				left: calc(50%);
				width: 10px;
				height: 10px;
				border-radius: var(--border-radius);
				transform: translateX(-50%) rotate(45deg);
				background-color: var(--input-background-color-alt);
			}
		}

		&:active {
			.thumb-label,
			.ticks {
				opacity: 1;
			}
		}
	}

	.append {
		margin-left: 8px;
	}
}
</style>
