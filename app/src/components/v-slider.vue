<script setup lang="ts">
import { computed } from 'vue';

interface Props {
	/** Disables the slider */
	disabled?: boolean;
	/** Set the non-editable state for the radio */
	nonEditable?: boolean;
	/** Show the thumb label on drag of the thumb */
	showThumbLabel?: boolean;
	/** Maximum allowed value */
	max?: number;
	/** Minimum allowed value */
	min?: number;
	/** In what step the value can be entered */
	step?: number;
	/** Show tick for each step */
	showTicks?: boolean;
	/** Always the current selected value */
	alwaysShowValue?: boolean;
	/** Model the current selected value */
	modelValue?: number | null;
}

const props = withDefaults(defineProps<Props>(), {
	disabled: false,
	nonEditable: false,
	showThumbLabel: false,
	max: 100,
	min: 0,
	step: 1,
	showTicks: false,
	alwaysShowValue: true,
	modelValue: 0,
});

const emit = defineEmits(['change', 'update:modelValue']);

const styles = computed(() => {
	const min = props.min;
	const max = props.max;
	const step = props.step;

	let value = props.modelValue;

	if (value === null || value === undefined) {
		const mid = min + (max - min) / 2;
		value = Math.round((mid - min) / step) * step + min;
	}

	if (max === min) {
		return { '--_v-slider-percentage': 0 };
	}

	let percentage = ((value - min) / (max - min)) * 100;
	if (isNaN(percentage)) percentage = 0;
	return { '--_v-slider-percentage': percentage };
});

function onChange(event: Event) {
	const target = event.target as HTMLInputElement;
	emit('change', Number(target.value));
}

function onInput(event: Event) {
	const target = event.target as HTMLInputElement;
	emit('update:modelValue', Number(target.value));
}
</script>

<template>
	<div class="v-slider" :style="styles">
		<div v-if="$slots.prepend" class="prepend">
			<slot name="prepend" :value="modelValue" />
		</div>
		<div
			class="slider"
			:class="{ disabled, 'thumb-label-visible': showThumbLabel && alwaysShowValue, 'non-editable': nonEditable }"
		>
			<input
				:disabled="disabled"
				type="range"
				:value="modelValue"
				:max="max"
				:min="min"
				:step="step"
				@change="onChange"
				@input="onInput"
			/>
			<div class="fill" />
			<div v-if="showTicks" class="ticks">
				<span v-for="i in Math.floor((max - min) / step) + 1" :key="i" class="tick" />
			</div>
			<div v-if="showThumbLabel" class="thumb-label-wrapper">
				<div class="thumb-label" :class="{ visible: alwaysShowValue || nonEditable }">
					<slot name="thumb-label type-text" :value="modelValue">
						{{ modelValue }}
					</slot>
				</div>
			</div>
		</div>
		<div v-if="$slots.append" class="append">
			<slot name="append" :value="modelValue" />
		</div>
	</div>
</template>

<style lang="scss" scoped>
/*

	Available Variables:

		--v-slider-color        [var(--theme--form--field--input--border-color)]
		--v-slider-thumb-color  [var(--theme--primary)]
		--v-slider-fill-color   [var(--theme--primary)]

*/
.v-slider {
	display: flex;
	align-items: center;

	.prepend {
		margin-inline-end: 8px;
	}

	.slider {
		position: relative;
		inset-block-start: -3px;
		flex-grow: 1;

		&.disabled {
			input {
				cursor: not-allowed;
			}

			&:not(.non-editable) {
				--v-slider-thumb-color: var(--theme--foreground-subdued);
				--v-slider-fill-color: var(--theme--foreground-subdued);
			}
		}

		&.thumb-label-visible {
			margin-block-end: 30px;
		}

		input {
			inline-size: 100%;
			block-size: 4px;
			padding: 8px 0;
			background-color: var(--theme--background);
			background-image: var(--v-slider-track-background-image);
			border-radius: 10px;
			cursor: pointer;
			appearance: none;

			&::-webkit-slider-runnable-track {
				block-size: 4px;
				background: var(--v-slider-color, var(--theme--form--field--input--border-color));
				border: none;
				border-radius: 4px;
				box-shadow: none;
			}

			&::-moz-range-track {
				block-size: 4px;
				background: var(--v-slider-color, var(--theme--form--field--input--border-color));
				border: none;
				border-radius: 4px;
				box-shadow: none;
			}

			&::-webkit-slider-thumb {
				position: relative;
				z-index: 3;
				inline-size: 8px;
				block-size: 8px;
				margin-block-start: -2px;
				background: var(--theme--background);
				border: none;
				border-radius: 50%;
				box-shadow: none;
				box-shadow: 0 0 0 4px var(--v-slider-thumb-color, var(--theme--primary));
				transition: all var(--fast) var(--transition);
				appearance: none;
			}

			&::-moz-range-thumb {
				position: relative;
				z-index: 3;
				inline-size: 8px;
				block-size: 8px;
				margin-block-start: -2px;
				background: var(--v-slider-thumb-color, var(--theme--primary));
				border: none;
				border-radius: 50%;
				box-shadow: none;
				box-shadow: 0 0 0 4px var(--v-slider-thumb-color, var(--theme--primary));
				transition: all var(--fast) var(--transition);
				appearance: none;
			}
		}

		.fill {
			position: absolute;
			inset-block-start: 50%;
			inset-inline: 0;
			z-index: 2;
			inline-size: 100%;
			block-size: 4px;
			background-color: var(--v-slider-fill-color, var(--theme--primary));
			border-radius: 4px;
			transform: translateY(-5px) scaleX(calc(var(--_v-slider-percentage) / 100));
			transform-origin: left;
			pointer-events: none;

			html[dir='rtl'] & {
				transform-origin: right;
			}
		}

		.ticks {
			position: absolute;
			inset-block-start: 14px;
			inset-inline-start: 0;
			z-index: 2;
			display: flex;
			align-items: center;
			justify-content: space-between;
			inline-size: 100%;
			block-size: 4px;
			padding: 0 7px;
			opacity: 0;
			transition: opacity var(--fast) var(--transition);
			pointer-events: none;

			.tick {
				display: inline-block;
				inline-size: 4px;
				block-size: 4px;
				background-color: var(--v-slider-color, var(--theme--form--field--input--border-color));
				border-radius: 50%;
			}
		}

		.thumb-label-wrapper {
			position: absolute;
			inset-block-start: 100%;
			inset-inline-start: 7px;
			inline-size: calc(100% - 14px);
			overflow: visible;
			pointer-events: none;
		}

		.thumb-label {
			z-index: 1;
			position: absolute;
			inset-block-start: 0;
			inset-inline-start: calc(var(--_v-slider-percentage) * 1%);
			inline-size: auto;
			padding: 2px 6px;
			color: var(--foreground-inverted);
			font-weight: 600;
			background-color: var(--theme--primary);
			border-radius: var(--theme--border-radius);
			transform: translateX(-50%);
			opacity: 0;
			transition: opacity var(--fast) var(--transition);

			html[dir='rtl'] & {
				transform: translateX(50%);
			}

			&.visible {
				opacity: 1;
			}
		}

		&:hover:not(.disabled),
		&:focus-within:not(.disabled) {
			input {
				block-size: 4px;

				&::-webkit-slider-thumb {
					inline-size: 12px;
					block-size: 12px;
					margin-block-start: -4px;
					box-shadow: 0 0 0 4px var(--v-slider-thumb-color, var(--theme--primary));
					cursor: ew-resize;
				}

				&::-moz-range-thumb {
					inline-size: 12px;
					block-size: 12px;
					margin-block-start: -4px;
					box-shadow: 0 0 0 4px var(--v-slider-thumb-color, var(--theme--primary));
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
		margin-inline-start: 8px;
	}
}
</style>
