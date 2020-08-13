<template>
	<div class="v-slider" :style="styles">
		<div v-if="$slots['prepend']" class="prepend">
			<slot name="prepend" :value="value" />
		</div>
		<div class="slider">
			<input type="range" :value="value" :max="max" :min="min" :step="step" @change="onChange" @input="onInput" />
			<div class="fill" />
			<div v-if="showTicks" class="ticks">
				<span class="tick" v-for="i in (max - min) / step + 1" :key="i" />
			</div>
			<div v-if="showThumbLabel" class="thumb-label-wrapper">
				<div class="thumb-label">
					<slot name="thumb-label type-text" :value="value">
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
import { defineComponent, computed } from '@vue/composition-api';
import { ChangeEvent } from 'react';

export default defineComponent({
	props: {
		showThumbLabel: {
			type: Boolean,
			default: false,
		},
		max: {
			type: Number,
			default: 100,
		},
		min: {
			type: Number,
			default: 0,
		},
		step: {
			type: Number,
			default: 1,
		},
		showTicks: {
			type: Boolean,
			default: false,
		},
		value: {
			type: Number,
			default: 50,
		},
	},
	setup(props, { emit }) {
		const styles = computed(() => ({
			'--_v-slider-percentage': ((props.value - props.min) / (props.max - props.min)) * 100,
		}));

		return {
			styles,
			onChange,
			onInput,
		};

		function onChange(event: ChangeEvent) {
			const target = event.target as HTMLInputElement;
			emit('change', Number(target.value));
		}

		function onInput(event: InputEvent) {
			const target = event.target as HTMLInputElement;
			emit('input', Number(target.value));
		}
	},
});
</script>

<style>
body {
	--v-slider-color: var(--border-normal);
	--v-slider-thumb-color: var(--foreground-normal);
	--v-slider-fill-color: var(--foreground-normal);
}
</style>

<style lang="scss" scoped>
.v-slider {
	display: flex;
	align-items: center;

	.prepend {
		margin-right: 8px;
	}

	.slider {
		position: relative;
		top: -3px;
		flex-grow: 1;

		input {
			width: 100%;
			height: 2px;
			-webkit-appearance: none;
			appearance: none;

			&::-webkit-slider-runnable-track {
				height: 2px;
				background: var(--v-slider-color);
				border: none;
				border-radius: 2px;
				box-shadow: none;
			}

			&::-moz-range-track {
				height: 2px;
				background: var(--v-slider-color);
				border: none;
				border-radius: 2px;
				box-shadow: none;
			}

			&::-webkit-slider-thumb {
				position: relative;
				z-index: 3;
				width: 14px;
				height: 14px;
				margin-top: -6px;
				background: var(--v-slider-thumb-color);
				border: none;
				border-radius: 50%;
				box-shadow: none;
				box-shadow: 0 0 0 4px var(--background-page);
				cursor: ew-resize;
				-webkit-appearance: none;
				appearance: none;
			}

			&::-moz-range-thumb {
				position: relative;
				z-index: 3;
				width: 14px;
				height: 14px;
				margin-top: -6px;
				background: var(--v-slider-thumb-color);
				border: none;
				border-radius: 50%;
				box-shadow: none;
				box-shadow: 0 0 0 4px var(--background-page);
				cursor: ew-resize;
				-webkit-appearance: none;
				appearance: none;
			}
		}

		.fill {
			position: absolute;
			top: 50%;
			right: 0;
			left: 0;
			z-index: 2;
			width: 100%;
			height: 2px;
			background-color: var(--v-slider-fill-color);
			transform: translateY(3px) scaleX(calc(var(--_v-slider-percentage) / 100));
			transform-origin: left;
			pointer-events: none;
		}

		.ticks {
			position: absolute;
			top: 13px;
			left: 0;
			display: flex;
			align-items: center;
			justify-content: space-between;
			width: 100%;
			height: 4px;
			padding: 0 7px;
			opacity: 0;
			transition: opacity var(--fast) var(--transition);
			pointer-events: none;

			.tick {
				display: inline-block;
				width: 4px;
				height: 4px;
				background-color: var(--v-slider-fill-color);
				border-radius: 50%;
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
			position: absolute;
			top: 10px;
			left: calc(var(--_v-slider-percentage) * 1%);
			width: max-content;
			padding: 4px 8px;
			color: var(--foreground-inverted);
			font-weight: 600;
			background-color: var(--primary);
			border-radius: var(--border-radius);
			transform: translateX(-50%);
			opacity: 0;
			transition: opacity var(--fast) var(--transition);

			&::before {
				position: absolute;
				top: -4px;
				left: calc(50%);
				width: 10px;
				height: 10px;
				background-color: var(--primary);
				border-radius: 2px;
				transform: translateX(-50%) rotate(45deg);
				content: '';
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
