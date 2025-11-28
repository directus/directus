<script setup lang="ts">
import { computed } from 'vue';

interface Props {
	/** What value to represent when selected */
	value: string | number | null;
	/** If `value` and `modelValue` match, the radio is selected */
	modelValue?: string | number | null;
	/** Label to render next to the radio */
	label?: string | null;
	/** Disable the radio button */
	disabled?: boolean;
	/** Set the non-editable state for the radio */
	nonEditable?: boolean;
	/** Change the icon to display when enabled */
	iconOn?: string;
	/** Change the icon to display when disabled */
	iconOff?: string;
	/** Render the radio in a block like style */
	block?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	modelValue: null,
	label: null,
	disabled: false,
	nonEditable: false,
	iconOn: 'radio_button_checked',
	iconOff: 'radio_button_unchecked',
	block: false,
});

const emit = defineEmits(['update:modelValue']);

const isChecked = computed<boolean>(() => {
	return props.modelValue === props.value;
});

const icon = computed<string>(() => {
	return isChecked.value ? props.iconOn : props.iconOff;
});

function emitValue(): void {
	emit('update:modelValue', props.value);
}
</script>

<template>
	<button
		class="v-radio"
		type="button"
		:aria-pressed="isChecked ? 'true' : 'false'"
		:disabled="disabled"
		:class="{ checked: isChecked, block, 'non-editable': nonEditable }"
		@click="emitValue"
	>
		<v-icon :name="icon" />
		<span class="label type-text">
			<slot name="label">{{ label }}</slot>
		</span>
	</button>
</template>

<style lang="scss" scoped>
@use '@/styles/mixins';

/*

	Available Variables:

		--v-radio-color  [var(--theme--primary)]

*/

.v-radio {
	display: flex;
	align-items: center;
	font-size: 0;
	text-align: start;
	background-color: transparent;
	border: none;
	border-radius: 0;
	appearance: none;

	.label:not(:empty) {
		margin-inline-start: 8px;

		@include mixins.no-wrap;
	}

	& .v-icon {
		--v-icon-color: var(--theme--foreground-subdued);
	}

	&:disabled {
		cursor: not-allowed;

		&:not(.non-editable) {
			.label {
				color: var(--theme--foreground-subdued);
			}

			.v-icon {
				--v-icon-color: var(--theme--foreground-subdued);
			}
		}
	}

	&.block {
		position: relative;
		inline-size: 100%;
		block-size: var(--theme--form--field--input--height);
		padding: calc(14px - 2 * var(--theme--border-width));
		border: var(--theme--border-width) solid var(--theme--form--field--input--background-subdued);
		border-radius: var(--theme--border-radius);

		&::before {
			position: absolute;
			inset-block-start: 0;
			inset-inline-start: 0;
			inline-size: 100%;
			block-size: 100%;
			background-color: var(--theme--form--field--input--background-subdued);
			border-radius: var(--theme--border-radius);
			content: '';
		}

		.label {
			z-index: 1;
		}
	}

	&:not(:disabled):hover {
		.v-icon {
			--v-icon-color: var(--theme--foreground-subdued);
		}
	}

	&:not(:disabled).checked,
	&.checked.non-editable {
		.v-icon {
			--v-icon-color: var(--v-radio-color, var(--theme--primary));
		}

		&.block {
			border-color: var(--v-radio-color, var(--theme--primary));

			.label {
				color: var(--v-radio-color, var(--theme--primary));
			}

			&::before {
				background-color: var(--v-radio-color, var(--theme--primary));
				opacity: 0.1;
			}
		}
	}
}
</style>
