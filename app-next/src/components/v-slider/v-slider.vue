<template>
	<div class="v-slider" :style="styles">
		<div v-if="$slots['prepend']" class="prepend">
			<slot name="prepend" :value="value" />
		</div>
		<div class="slider" :class="{ disabled }">
			<input
				:disabled="disabled"
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
				<div class="thumb-label" :class="{ visible: alwaysShowValue }">
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

export default defineComponent({
	props: {
		disabled: {
			type: Boolean,
			default: false,
		},
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
		alwaysShowValue: {
			type: Boolean,
			default: false,
		},
		value: {
			type: Number,
			default: 0,
		},
	},
	setup(props, { emit }) {
		const styles = computed(() => {
			if (props.value === null) return { '--_v-slider-percentage': 50 };

			let percentage = ((props.value - props.min) / (props.max - props.min)) * 100;
			if (percentage === NaN) percentage = 0;
			return { '--_v-slider-percentage': percentage };
		});

		return {
			styles,
			onChange,
			onInput,
		};

		function onChange(event: InputEvent) {
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
	--v-slider-thumb-color: var(--primary);
	--v-slider-fill-color: var(--primary);
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

		&.disabled {
			--v-slider-thumb-color: var(--foreground-subdued);
			--v-slider-fill-color: var(--foreground-subdued);
		}

		input {
			width: 100%;
			height: 4px;
			padding: 8px 0;
			background-color: var(--background-page);
			cursor: pointer;
			-webkit-appearance: none;
			appearance: none;

			&::-webkit-slider-runnable-track {
				height: 4px;
				background: var(--v-slider-color);
				border: none;
				border-radius: 4px;
				box-shadow: none;
			}

			&::-moz-range-track {
				height: 4px;
				background: var(--v-slider-color);
				border: none;
				border-radius: 4px;
				box-shadow: none;
			}

			&::-webkit-slider-thumb {
				position: relative;
				z-index: 3;
				width: 8px;
				height: 8px;
				margin-top: -2px;
				background: var(--background-page);
				border: none;
				border-radius: 50%;
				box-shadow: none;
				box-shadow: 0 0 0 4px var(--v-slider-thumb-color);
				transition: all var(--fast) var(--transition);
				-webkit-appearance: none;
				appearance: none;
			}

			&::-moz-range-thumb {
				position: relative;
				z-index: 3;
				width: 8px;
				height: 8px;
				margin-top: -2px;
				background: var(--v-slider-thumb-color);
				border: none;
				border-radius: 50%;
				box-shadow: none;
				box-shadow: 0 0 0 4px var(--v-slider-thumb-color);
				transition: all var(--fast) var(--transition);
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
			height: 4px;
			background-color: var(--v-slider-fill-color);
			border-radius: 4px;
			transform: translateY(-5px) scaleX(calc(var(--_v-slider-percentage) / 100));
			transform-origin: left;
			pointer-events: none;
		}

		.ticks {
			position: absolute;
			top: 14px;
			left: 0;
			z-index: 2;
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
				background-color: var(--v-slider-color);
				border-radius: 50%;
			}
		}

		.thumb-label-wrapper {
			position: absolute;
			top: 100%;
			left: 7px;
			width: calc(100% - 14px);
			overflow: visible;
			pointer-events: none;
		}

		.thumb-label {
			position: absolute;
			top: 0px;
			left: calc(var(--_v-slider-percentage) * 1%);
			width: auto;
			padding: 2px 6px;
			color: var(--foreground-inverted);
			font-weight: 600;
			background-color: var(--primary);
			border-radius: var(--border-radius);
			transform: translateX(-50%);
			opacity: 0;
			transition: opacity var(--fast) var(--transition);
			&.visible {
				opacity: 1;
			}
		}

		&:hover:not(.disabled),
		&:focus-within:not(.disabled) {
			input {
				height: 4px;
				&::-webkit-slider-thumb {
					width: 12px;
					height: 12px;
					margin-top: -4px;
					box-shadow: 0 0 0 4px var(--v-slider-thumb-color);
					cursor: ew-resize;
				}

				&::-moz-range-thumb {
					width: 12px;
					height: 12px;
					margin-top: -4px;
					box-shadow: 0 0 0 4px var(--v-slider-thumb-color);
					cursor: ew-resize;
				}
			}
			.thumb-label {
				opacity: 1;
			}
		}

		&:active:not(.disabled) {
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
