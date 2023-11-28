<script setup lang="ts">
import { computed } from 'vue';

interface Props {
	/** Disables the slider */
	disabled?: boolean;
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
	modelValue?: number;
}

const props = withDefaults(defineProps<Props>(), {
	disabled: false,
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
	if (props.modelValue === null) return { '--_v-slider-percentage': 50 };

	let percentage = ((props.modelValue - props.min) / (props.max - props.min)) * 100;
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
		<div class="slider" :class="{ disabled, 'thumb-label-visible': showThumbLabel && alwaysShowValue }">
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
				<div class="thumb-label" :class="{ visible: alwaysShowValue }">
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
		margin-right: 8px;
	}

	.slider {
		position: relative;
		top: -3px;
		flex-grow: 1;

		&.disabled {
			--v-slider-thumb-color: var(--theme--foreground-subdued);
			--v-slider-fill-color: var(--theme--foreground-subdued);
		}

		&.thumb-label-visible {
			margin-bottom: 30px;
		}

		input {
			width: 100%;
			height: 4px;
			padding: 8px 0;
			background-color: var(--theme--background);
			background-image: var(--v-slider-track-background-image);
			border-radius: 10px;
			cursor: pointer;
			appearance: none;

			&::-webkit-slider-runnable-track {
				height: 4px;
				background: var(--v-slider-color, var(--theme--form--field--input--border-color));
				border: none;
				border-radius: 4px;
				box-shadow: none;
			}

			&::-moz-range-track {
				height: 4px;
				background: var(--v-slider-color, var(--theme--form--field--input--border-color));
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
				width: 8px;
				height: 8px;
				margin-top: -2px;
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
			top: 50%;
			right: 0;
			left: 0;
			z-index: 2;
			width: 100%;
			height: 4px;
			background-color: var(--v-slider-fill-color, var(--theme--primary));
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
				background-color: var(--v-slider-color, var(--theme--form--field--input--border-color));
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
			z-index: 1;
			position: absolute;
			top: 0px;
			left: calc(var(--_v-slider-percentage) * 1%);
			width: auto;
			padding: 2px 6px;
			color: var(--foreground-inverted);
			font-weight: 600;
			background-color: var(--theme--primary);
			border-radius: var(--theme--border-radius);
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
					box-shadow: 0 0 0 4px var(--v-slider-thumb-color, var(--theme--primary));
					cursor: ew-resize;
				}

				&::-moz-range-thumb {
					width: 12px;
					height: 12px;
					margin-top: -4px;
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
		margin-left: 8px;
	}
}
</style>
